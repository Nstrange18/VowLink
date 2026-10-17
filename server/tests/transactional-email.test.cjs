const { inspect } = require("node:util");
jest.mock("../models/User", () => ({ find: jest.fn() }));
const { sendTransactionalEmail } = require("../services/transactionalEmail");
const envNames = ["BREVO_API_KEY", "EMAIL_FROM_ADDRESS", "EMAIL_FROM_NAME", "EMAIL_REPLY_TO"];
let prior;
let log;
const privateValues = ["synthetic-private-key", "guest@example.test", "reset-private-token"];
const message = { to: privateValues[1], subject: "Reset password", html: `https://example.test/reset/${privateValues[2]}` };
beforeEach(() => {
  prior = envNames.map(key => process.env[key]);
  envNames.forEach(key => delete process.env[key]);
  process.env.BREVO_API_KEY = privateValues[0];
  process.env.EMAIL_FROM_ADDRESS = "sender@example.test";
  global.fetch.mockReset();
  log = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  const output = inspect(log.mock.calls);
  privateValues.forEach(value => expect(output).not.toContain(value));
  log.mockRestore(); jest.useRealTimers();
  envNames.forEach((key, i) => { if (prior[i] === undefined) delete process.env[key]; else process.env[key] = prior[i]; });
});
test("sends unchanged HTML through HTTPS and returns acceptance, with optional reply-to", async () => {
  process.env.EMAIL_FROM_NAME = "VowLink Team"; process.env.EMAIL_REPLY_TO = "support@example.test";
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ messageId: "synthetic-message-id" }) });
  expect(await sendTransactionalEmail(message)).toEqual({ accepted: true, provider: "brevo", messageId: "synthetic-message-id" });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe("https://api.brevo.com/v3/smtp/email");
  expect(options.headers["api-key"]).toBe(privateValues[0]);
  expect(JSON.parse(options.body)).toEqual({ sender: { email: "sender@example.test", name: "VowLink Team" }, to: [{ email: message.to }], subject: message.subject, htmlContent: message.html, replyTo: { email: "support@example.test" } });
});
test("defaults display name and omits unconfigured reply-to", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ messageId: "id" }) });
  await sendTransactionalEmail(message);
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body.sender.name).toBe("VowLink"); expect(body).not.toHaveProperty("replyTo");
});
test.each([["BREVO_API_KEY", "EMAIL_API_KEY_MISSING"], ["EMAIL_FROM_ADDRESS", "EMAIL_SENDER_MISSING"]])("rejects missing %s without a request", async (key, code) => {
  delete process.env[key]; await expect(sendTransactionalEmail(message)).rejects.toMatchObject({ code }); expect(global.fetch).not.toHaveBeenCalled();
});
test.each([400, 401, 429, 500, 503])("sanitizes provider HTTP %i without reading its private body or retrying", async status => {
  const json = jest.fn(); const text = jest.fn();
  global.fetch.mockResolvedValue({ ok: false, status, json, text });
  await expect(sendTransactionalEmail(message)).rejects.toMatchObject({ code: status === 429 ? "EMAIL_RATE_LIMITED" : "EMAIL_PROVIDER_REJECTED", httpStatus: status });
  expect(json).not.toHaveBeenCalled(); expect(text).not.toHaveBeenCalled(); expect(global.fetch).toHaveBeenCalledTimes(1);
});
test("network errors never retain the original error or private request details", async () => {
  global.fetch.mockRejectedValue(Object.assign(new Error(privateValues.join(" ")), { request: message, headers: { authorization: privateValues[0] } }));
  try { await sendTransactionalEmail(message); throw new Error("expected rejection"); }
  catch (error) { expect(error.code).toBe("EMAIL_NETWORK_OR_RESPONSE_ERROR"); privateValues.forEach(value => expect(inspect(error)).not.toContain(value)); }
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test("aborts at ten seconds without retry", async () => {
  jest.useFakeTimers();
  global.fetch.mockImplementation((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error(privateValues.join(" "))))));
  const result = expect(sendTransactionalEmail(message)).rejects.toMatchObject({ code: "EMAIL_TIMEOUT" });
  await jest.advanceTimersByTimeAsync(10000); await result; expect(global.fetch).toHaveBeenCalledTimes(1);
});
test.each([null, {}, { messageId: "" }])("does not claim acceptance without message ID: %j", async body => {
  global.fetch.mockResolvedValue({ ok: true, status: 201, json: async () => body });
  await expect(sendTransactionalEmail(message)).rejects.toMatchObject({ code: "EMAIL_ACCEPTANCE_UNCONFIRMED" });
});
test("malformed success response is safe and not retried", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => { throw new Error(privateValues.join(" ")); } });
  await expect(sendTransactionalEmail(message)).rejects.toMatchObject({ code: "EMAIL_NETWORK_OR_RESPONSE_ERROR" });
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
test.each(["BREVO_API_KEY", "EMAIL_FROM_ADDRESS"])("real wedding helper leaves flag unset when %s is absent", async key => {
  delete process.env[key];
  const user = { weddingDate: new Date(), email: "guest@example.test", weddingEmailSent: false, save: jest.fn() };
  require("../models/User").find.mockResolvedValue([user]);
  await require("../services/weddingDayEmails").checkWeddingDaysToday();
  expect(user.weddingEmailSent).toBe(false); expect(user.save).not.toHaveBeenCalled(); expect(global.fetch).not.toHaveBeenCalled();
});
test("application code and dependency manifest no longer initialize the previous provider", () => {
  const fs = require("node:fs"); const path = require("node:path");
  const oldProvider = ["send", "grid"].join("");
  for (const file of ["routes/authRoutes.js", "utils/email.js", "package.json"]) {
    expect(fs.readFileSync(path.join(__dirname, "..", file), "utf8").toLowerCase()).not.toContain(oldProvider);
  }
});
