const http = require("node:http");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");
jest.mock("axios", () => ({}));
jest.mock("../models/Invitation", () => ({ findOne: jest.fn() }));
jest.mock("../models/User", () => ({ findById: jest.fn() }));
jest.mock("../models/RSVP", () => ({ exists: jest.fn() }));
jest.mock("../models/WhatsAppSendLedger", () => ({}));
jest.mock("../models/WhatsAppReminder", () => ({ init: jest.fn().mockResolvedValue(undefined), findOne: jest.fn(), create: jest.fn(), updateMany: jest.fn(), updateOne: jest.fn(), find: jest.fn() }));
jest.mock("../utils/whatsappCredits", () => ({ reserveWhatsAppSendCredit: jest.fn(), refundWhatsAppSendCredit: jest.fn() }));
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const RSVP = require("../models/RSVP");
const Reminder = require("../models/WhatsAppReminder");
const credits = require("../utils/whatsappCredits");
const router = require("../routes/whatsappRoutes");
const { sendManualReminder } = require("../services/whatsappReminders");
const { buildReminderPayload } = require("../utils/whatsappReminderCloud");

const ownerId = "111111111111111111111111";
const invitationId = "222222222222222222222222";
const otherId = "333333333333333333333333";
const requestKey = "synthetic-reminder-key-001";
const environment = { WHATSAPP_PHONE_NUMBER_ID: "synthetic-phone", WHATSAPP_BUSINESS_ACCOUNT_ID: "synthetic-account", WHATSAPP_ACCESS_TOKEN: "synthetic-token", WHATSAPP_APP_SECRET: "synthetic-webhook-secret" };
let server, owner, invitation, records, previousEnvironment;
const matches = (record, query) => Object.entries(query).every(([key, value]) => String(record[key]) === String(value));
const token = () => jwt.sign({ id: ownerId }, process.env.JWT_SECRET);
const single = (key = requestKey) => request(server).post(`/api/whatsapp/reminders/send/${invitationId}`).set("Authorization", `Bearer ${token()}`).set("Idempotency-Key", key).send({});
const bulk = (ids) => request(server).post("/api/whatsapp/reminders/send-bulk").set("Authorization", `Bearer ${token()}`).set("Idempotency-Key", requestKey).send({ invitationIds: ids });
const metaSuccess = () => global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ messages: [{ id: "wamid.reminder" }] }) });

beforeAll(async () => {
  const app = express();
  app.use(express.json({ verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); } }));
  app.use("/api/whatsapp", router);
  server = http.createServer(app); allowTestServer(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
});
afterAll(async () => new Promise((resolve) => server.close(resolve)));
beforeEach(() => {
  jest.clearAllMocks();
  previousEnvironment = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  Object.assign(process.env, environment);
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
  owner = { _id: ownerId, tier: "pro", partner1Name: "Alex", partner2Name: "Morgan", rsvpDeadline: new Date("2099-06-01"), weddingDate: new Date("2099-07-01") };
  invitation = { _id: invitationId, userId: ownerId, guestName: "Synthetic Guest", phoneNumber: "2348000000001", slug: "synthetic-guest", hasRSVPed: false, whatsappMessageId: "wamid.invitation", whatsappStatus: "read" };
  User.findById.mockImplementation(() => Object.assign(Promise.resolve(owner), { select: async () => owner }));
  Invitation.findOne.mockImplementation(async (query) => matches(invitation, query) ? invitation : null);
  RSVP.exists.mockReset().mockResolvedValue(null);
  records = [];
  Reminder.findOne.mockImplementation(async (query) => records.find((record) => matches(record, query)) || null);
  Reminder.create.mockImplementation(async (values) => {
    if (records.some((record) => record.lockKey === values.lockKey || (record.invitationId === values.invitationId && record.requestKey === values.requestKey))) throw Object.assign(new Error("duplicate"), { code: 11000 });
    const record = { _id: otherId, trigger: "manual", templateName: "vowlink_rsvp_reminder", sendStatus: "preparing", deliveryStatus: "not_sent", creditState: "none", ...values, createdAt: new Date() };
    record.save = jest.fn().mockResolvedValue(record); records.push(record); return record;
  });
  Reminder.updateMany.mockImplementation(async ({ lockKey }) => {
    records.forEach((record) => { if (record.lockKey === lockKey && record.sendStatus === "accepted" && record.lockUntil <= new Date()) delete record.lockKey; });
  });
  Reminder.updateOne.mockImplementation(async (query, { $set }) => {
    const record = records.find((item) => item._id === query._id && !query.deliveryStatus.$nin.includes(item.deliveryStatus));
    if (record) Object.assign(record, $set);
  });
  Reminder.find.mockImplementation(() => ({ sort: () => ({ limit: () => ({ populate: () => ({ lean: async () => records }) }) }) }));
  credits.reserveWhatsAppSendCredit.mockReset().mockResolvedValue({ reserved: true });
  credits.refundWhatsAppSendCredit.mockReset().mockResolvedValue({ remaining: 10 });
  global.fetch.mockReset(); metaSuccess();
});
afterEach(() => {
  for (const [key, value] of Object.entries(previousEnvironment)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  console.error.mockRestore(); console.info.mockRestore();
});

test("requires authentication", async () => {
  expect((await request(server).post(`/api/whatsapp/reminders/send/${invitationId}`).send({})).status).toBe(401);
  expect(global.fetch).not.toHaveBeenCalled();
});
test.each(["unpaid", "free", "plus"])("rejects %s for sending and history", async (tier) => {
  owner.tier = tier;
  expect((await single()).status).toBe(403);
  expect((await bulk([invitationId])).status).toBe(403);
  expect((await request(server).get("/api/whatsapp/reminders/history").set("Authorization", `Bearer ${token()}`)).status).toBe(403);
  expect(global.fetch).not.toHaveBeenCalled();
});
test("sends three named variables and the slug, separately from original invitation state", async () => {
  expect((await single()).status).toBe(200);
  const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(payload.template).toEqual({ name: "vowlink_rsvp_reminder", language: { code: "en" }, components: [
    { type: "body", parameters: [
      { type: "text", parameter_name: "guest_name", text: "Synthetic Guest" },
      { type: "text", parameter_name: "couple_names", text: "Alex and Morgan" },
      { type: "text", parameter_name: "rsvp_deadline", text: "1 June 2099" },
    ] },
    { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "synthetic-guest" }] },
  ] });
  expect(invitation.whatsappMessageId).toBe("wamid.invitation"); expect(invitation.whatsappStatus).toBe("read");
  expect(records[0]).toMatchObject({ sendStatus: "accepted", deliveryStatus: "queued", creditState: "consumed", whatsappMessageId: "wamid.reminder", rsvpDeadline: owner.rsvpDeadline });
  expect(credits.reserveWhatsAppSendCredit).toHaveBeenCalledWith(ownerId, { atomic: true });
});
test.each(["Yes", "No"])("excludes an existing %s RSVP even if the invitation flag is stale", async () => {
  RSVP.exists.mockResolvedValue({ _id: otherId });
  expect((await single()).status).toBe(409);
  expect(credits.reserveWhatsAppSendCredit).not.toHaveBeenCalled(); expect(global.fetch).not.toHaveBeenCalled();
});
test("excludes a guest with hasRSVPed set", async () => {
  invitation.hasRSVPed = true; expect((await single()).status).toBe(409); expect(global.fetch).not.toHaveBeenCalled();
});
test("checks ownership", async () => {
  invitation.userId = otherId; expect((await single()).status).toBe(404); expect(global.fetch).not.toHaveBeenCalled();
});
test.each([null, new Date("2000-01-01")])("rejects missing/expired deadline %s", async (deadline) => {
  owner.rsvpDeadline = deadline; expect((await single()).status).toBe(409); expect(global.fetch).not.toHaveBeenCalled();
});
test("RSVP arriving during credit reservation stops sending and refunds", async () => {
  credits.reserveWhatsAppSendCredit.mockImplementation(async () => { invitation.hasRSVPed = true; return { reserved: true }; });
  expect((await single()).status).toBe(409);
  expect(global.fetch).not.toHaveBeenCalled(); expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledWith(ownerId, { atomic: true });
  expect(records[0].creditState).toBe("refunded");
});
test("no credit means no Meta request", async () => {
  credits.reserveWhatsAppSendCredit.mockResolvedValue({ reserved: false });
  expect((await single()).status).toBe(402); expect(global.fetch).not.toHaveBeenCalled(); expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
});
test("uncertain credit reservation stays locked without a Meta request or blind refund", async () => {
  credits.reserveWhatsAppSendCredit.mockRejectedValue(new Error("database response lost"));
  expect((await single()).body.data).toMatchObject({ sendStatus: "unknown", creditState: "unknown" });
  expect((await single("synthetic-new-key-002")).status).toBe(409);
  expect(global.fetch).not.toHaveBeenCalled(); expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
});
test("uncertain refund blocks manual retry instead of decrementing twice", async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
  credits.refundWhatsAppSendCredit.mockRejectedValue(new Error("refund acknowledgement lost"));
  expect((await single()).body.data).toMatchObject({ sendStatus: "unknown", creditState: "unknown" });
  expect((await single("synthetic-new-key-002")).status).toBe(409);
  expect(global.fetch).toHaveBeenCalledTimes(1); expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
});
test("definitive Meta rejection refunds once, same key never retries, new key may retry", async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { message: "Template not approved", code: 100 } }) });
  const response = await single(); expect(response.body.data.sendStatus).toBe("failed"); expect(response.body.data.creditState).toBe("refunded");
  expect(response.body.data.failureReason).not.toContain("Template not approved");
  await single(); expect(global.fetch).toHaveBeenCalledTimes(1); expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
  metaSuccess(); await single("synthetic-reminder-new-key"); expect(global.fetch).toHaveBeenCalledTimes(2);
});
test("network failure stays unknown, retains credit and prevents retry with another key", async () => {
  global.fetch.mockRejectedValue(new Error("network failed"));
  expect((await single()).body.data.sendStatus).toBe("unknown");
  expect((await single("synthetic-reminder-new-key")).status).toBe(409);
  await single(); expect(global.fetch).toHaveBeenCalledTimes(1); expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
});
test.each([{}, null])("success without a message ID (%j) is unknown and not retried", async (body) => {
  global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => body });
  expect((await single()).body.data.sendStatus).toBe("unknown"); expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
});
test("a deadline edit during reservation stops sending and refunds", async () => {
  credits.reserveWhatsAppSendCredit.mockImplementation(async () => { owner.rsvpDeadline = new Date("2099-06-02"); return { reserved: true }; });
  expect((await single()).status).toBe(409); expect(global.fetch).not.toHaveBeenCalled();
  expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
});
test("known Meta acceptance is retained after a recoverable local save failure", async () => {
  const create = Reminder.create.getMockImplementation();
  Reminder.create.mockImplementation(async (values) => {
    const record = await create(values);
    record.save.mockReset().mockResolvedValue(record)
      .mockResolvedValueOnce(record).mockResolvedValueOnce(record).mockRejectedValueOnce(new Error("temporary database failure"));
    return record;
  });
  const response = await single();
  expect(response.body.data).toMatchObject({ sendStatus: "accepted", creditState: "consumed", messageId: "wamid.reminder" });
  expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
  expect((await single("synthetic-new-key-002")).status).toBe(409);
});
test("duplicate concurrent requests claim only one persistent lock", async () => {
  await Promise.allSettled([sendManualReminder({ userId: ownerId, invitationId, requestKey }), sendManualReminder({ userId: ownerId, invitationId, requestKey: "synthetic-concurrent-key" })]);
  expect(global.fetch).toHaveBeenCalledTimes(1); expect(credits.reserveWhatsAppSendCredit).toHaveBeenCalledTimes(1);
});
test("accepted reminder has a 24-hour cooldown", async () => {
  await single(); expect((await single("synthetic-new-key-002")).status).toBe(409);
  records[0].lockUntil = new Date("2000-01-01");
  expect((await single("synthetic-new-key-002")).body.data.sendStatus).toBe("accepted"); expect(global.fetch).toHaveBeenCalledTimes(2);
});
test("bulk deduplicates IDs and skips other-owner guests", async () => {
  const response = await bulk([invitationId, invitationId, otherId]);
  expect(response.body.results).toHaveLength(2);
  expect(response.body.results[1].status).toBe("skipped"); expect(global.fetch).toHaveBeenCalledTimes(1);
});
test("history queries only the owner and excludes lock/request metadata", async () => {
  await single(); const response = await request(server).get("/api/whatsapp/reminders/history").set("Authorization", `Bearer ${token()}`);
  expect(Reminder.find).toHaveBeenCalledWith({ userId: ownerId });
  expect(response.body.history[0].templateName).toBe("vowlink_rsvp_reminder");
  expect(response.body.history[0].lockKey).toBeUndefined(); expect(response.body.history[0].requestKey).toBeUndefined();
});
test.each(["https://vowlink.co/invite/test", "{{1}}test", "%7B%7B1%7D%7Dtest"])("rejects non-slug button %s before Meta", async (slug) => {
  invitation.slug = slug; expect((await single()).status).toBe(400); expect(global.fetch).not.toHaveBeenCalled();
});
test("requires a request key", async () => {
  expect((await request(server).post(`/api/whatsapp/reminders/send/${invitationId}`).set("Authorization", `Bearer ${token()}`)).status).toBe(400);
});

test.each([
  ["sent", undefined, "sent"], ["delivered", undefined, "delivered"], ["read", undefined, "read"],
  ["failed", "healthy ecosystem engagement", "marketing_limited"],
  ["failed", "Business eligibility payment issue", "payment_issue"], ["failed", "Technical error", "technical_failure"],
])("signed %s webhook updates only the reminder (%s)", async (status, reason, expected) => {
  await single();
  const body = JSON.stringify({ entry: [{ changes: [{ field: "messages", value: { statuses: [{ id: "wamid.reminder", status, errors: reason ? [{ error_data: { details: reason } }] : [] }] } }] }] });
  const signature = `sha256=${crypto.createHmac("sha256", environment.WHATSAPP_APP_SECRET).update(body).digest("hex")}`;
  Invitation.findOne.mockClear();
  const response = await request(server).post("/api/whatsapp/webhook").set("Content-Type", "application/json").set("x-hub-signature-256", signature).send(body);
  expect(response.status).toBe(200); expect(records[0].deliveryStatus).toBe(expected);
  expect(Invitation.findOne).not.toHaveBeenCalled(); expect(invitation.whatsappStatus).toBe("read");
  expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
});

test("reminder read cannot be downgraded by a late failure", async () => {
  await single(); records[0].deliveryStatus = "read";
  const { applyReminderWebhook } = require("../services/whatsappReminders");
  await applyReminderWebhook("wamid.reminder", "failed", "Payment issue");
  expect(records[0].deliveryStatus).toBe("read");
});
test("schema accepts separate reminder records without connecting to MongoDB", () => {
  const ActualReminder = jest.requireActual("../models/WhatsAppReminder");
  const record = new ActualReminder({ userId: ownerId, invitationId, requestKey, rsvpDeadline: owner.rsvpDeadline });
  expect(record.validateSync()).toBeUndefined(); expect(record.trigger).toBe("manual");
});
test("deadline formats consistently regardless of server timezone", () => {
  expect(buildReminderPayload({ to: invitation.phoneNumber, guestName: "Guest", coupleNames: "Couple", deadline: owner.rsvpDeadline, slug: invitation.slug }).template.components[0].parameters[2].text).toBe("1 June 2099");
});
test("preserves valid existing slugs containing consecutive hyphens", () => {
  const payload = buildReminderPayload({ to: invitation.phoneNumber, guestName: "Guest", coupleNames: "Couple", deadline: owner.rsvpDeadline, slug: "synthetic--guest" });
  expect(payload.template.components[1].parameters[0].text).toBe("synthetic--guest");
});
