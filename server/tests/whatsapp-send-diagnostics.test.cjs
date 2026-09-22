const http = require("node:http");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");

jest.mock("axios", () => ({}));
jest.mock("../middleware/auth", () => ({ protect: (req, _res, next) => {
  req.user = { id: "synthetic-user" }; next();
} }));
jest.mock("../models/Invitation", () => ({ find: jest.fn() }));
jest.mock("../models/User", () => ({ findById: jest.fn() }));
jest.mock("../models/WhatsAppSendLedger", () => ({}));
jest.mock("../utils/whatsappCredits", () => ({
  getWhatsAppUsage: jest.fn(), reserveWhatsAppSendCredit: jest.fn(),
  refundWhatsAppSendCredit: jest.fn(), recordWhatsAppSend: jest.fn(),
}));

const Invitation = require("../models/Invitation");
const User = require("../models/User");
const credits = require("../utils/whatsappCredits");
const router = require("../routes/whatsappRoutes");
const { sendInvitationTemplate } = require("../utils/whatsappCloud");
const { getSendDiagnostics } = require("../utils/whatsappSendDiagnostics");
const environment = {
  WHATSAPP_PHONE_NUMBER_ID: "synthetic-phone-id",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "synthetic-business-id",
  WHATSAPP_ACCESS_TOKEN: "synthetic-access-secret",
  WHATSAPP_APP_SECRET: "synthetic-app-secret",
  META_APP_SECRET: "synthetic-meta-secret",
  FACEBOOK_APP_SECRET: "synthetic-facebook-secret",
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: "synthetic-webhook-secret",
  PUBLIC_SITE_URL: "https://example.invalid",
};
const privateData = {
  to: "2348000000001", guestName: "Synthetic Guest",
  coupleNames: "Synthetic Partner One and Synthetic Partner Two",
  inviteLink: "https://example.invalid/invite/private-invite-token",
};
const usage = { remaining: 8 };

describe("WhatsApp send diagnostics", () => {
  let server;
  let previousEnvironment;
  let log;
  let info;
  let invitation;
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/whatsapp", router);
    server = http.createServer(app);
    allowTestServer(server);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  });
  beforeEach(() => {
    previousEnvironment = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
    Object.assign(process.env, environment);
    jest.clearAllMocks();
    log = jest.spyOn(console, "error").mockImplementation(() => {});
    info = jest.spyOn(console, "info").mockImplementation(() => {});
    invitation = {
      _id: "synthetic-invitation", guestName: privateData.guestName,
      phoneNumber: privateData.to, slug: "private-invite-token", whatsappStatus: "pending",
      save: jest.fn().mockResolvedValue(undefined),
    };
    Invitation.find.mockResolvedValue([invitation]);
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({
      tier: "pro", partner1Name: "Synthetic Partner One", partner2Name: "Synthetic Partner Two",
    }) });
    credits.getWhatsAppUsage.mockReturnValue(usage);
    credits.reserveWhatsAppSendCredit.mockReset().mockResolvedValue({ reserved: true, usage });
    credits.refundWhatsAppSendCredit.mockResolvedValue(usage);
    credits.recordWhatsAppSend.mockResolvedValue(undefined);
    global.fetch.mockReset();
  });
  afterEach(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    log.mockRestore(); info.mockRestore();
  });
  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  const post = () => request(server).post("/api/whatsapp/send-bulk")
    .send({ invitationIds: ["synthetic-invitation"] });
  const metaFailure = (status = 400, error = {}) => {
    global.fetch.mockResolvedValue({ ok: false, status, json: jest.fn().mockResolvedValue({ error: {
      message: "Business eligibility payment issue", code: 131042, error_subcode: 2494010,
      type: "OAuthException", fbtrace_id: "SyntheticTrace_123", ...error,
    } }) });
  };
  const diagnostic = () => log.mock.calls.find(([message]) =>
    message === "[WHATSAPP SEND] Individual bulk send failed.")?.[1];
  const expectPublicFailure = (response) => {
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "0 invites submitted.", sent: 0, submitted: 0, failed: 1,
      skipped: 0, creditSkipped: 0, usage,
      results: [{ id: invitation._id, status: "failed",
        message: "We could not send this invite. Please try again.",
        data: {
          _id: invitation._id, guestName: privateData.guestName, phoneNumber: privateData.to,
          slug: "private-invite-token", whatsappStatus: "failed", whatsappProvider: "cloud_api",
          whatsappFailedAt: expect.any(String),
          whatsappFailureReason: "We could not send this invite. Please try again.",
        },
      }],
    });
  };

  test.each([400, 500])("retains and logs structured Meta HTTP %i errors without altering results or refunds", async (status) => {
    metaFailure(status);
    expectPublicFailure(await post());
    expect(diagnostic()).toEqual({
      failureSource: "meta_http_error", httpStatus: status, metaCode: 131042,
      metaSubcode: 2494010, metaType: "OAuthException",
      metaMessage: "Business eligibility payment issue", fbtrace_id: "SyntheticTrace_123",
    });
    expect(log).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
    expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledWith("synthetic-user");
  });

  test("keeps the original error details for existing public message mapping", async () => {
    metaFailure(400, { error_data: { details: "Invalid template parameter" } });
    await expect(sendInvitationTemplate(privateData)).rejects.toThrow("Invalid template parameter");
    expect((await post()).body.results[0].message)
      .toBe("The WhatsApp template needs attention before this invite can be sent.");
  });

  test.each([null, {}, { error: "unexpected" }])("handles malformed Meta JSON %j", async (payload) => {
    global.fetch.mockResolvedValue({ ok: false, status: 502, json: async () => payload });
    expectPublicFailure(await post());
    expect(diagnostic()).toMatchObject({ failureSource: "meta_http_error", httpStatus: 502 });
    expect(diagnostic().metaCode).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("handles a non-JSON Meta response", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 503, json: async () => { throw new Error("private response body"); } });
    expectPublicFailure(await post());
    expect(diagnostic()).toMatchObject({ failureSource: "meta_http_error", httpStatus: 503 });
    expect(JSON.stringify(log.mock.calls)).not.toContain("private response body");
  });

  test("does not log secrets, headers, payloads or personal data echoed by Meta", async () => {
    const privateText = [...Object.values(environment), ...Object.values(privateData),
      "private-invite-token", "person@example.invalid", "Authorization: Bearer confidential", "unknown-sensitive-text"].join(" ");
    metaFailure(400, {
      message: privateText, error_data: { details: privateText },
      headers: { Authorization: privateText }, request: privateData, response: privateText,
      type: privateData.guestName, fbtrace_id: environment.WHATSAPP_ACCESS_TOKEN,
    });
    await post();
    const output = JSON.stringify(log.mock.calls);
    for (const value of [...Object.values(environment), ...Object.values(privateData),
      "private-invite-token", "person@example.invalid", "confidential", "unknown-sensitive-text"]) {
      expect(output).not.toContain(value);
    }
    expect(diagnostic().metaMessage).toBe("Meta rejected the send; provider text withheld for privacy.");
    expect(diagnostic().metaType).toBeUndefined();
    expect(diagnostic().fbtrace_id).toBeUndefined();
    expect(Object.keys(diagnostic()).sort()).toEqual([
      "failureSource", "httpStatus", "metaCode", "metaSubcode", "metaType", "metaMessage", "fbtrace_id",
    ].sort());
  });

  test("distinguishes a network failure without claiming Meta did not receive it", async () => {
    global.fetch.mockRejectedValue(new Error("connection lost private-invite-token"));
    expectPublicFailure(await post());
    expect(diagnostic()).toEqual({ failureSource: "no_http_response",
      metaMessage: "No HTTP response received; delivery to Meta is unknown." });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
  });

  test.each([privateData.to, "2348000000009", "SyntheticGuest", "person@example.invalid", "private-invite-token"])(
    "withholds personal or private trace values: %s", async (trace) => {
      const guestName = trace === "SyntheticGuest" ? trace : privateData.guestName;
      metaFailure(400, { fbtrace_id: trace });
      let caught;
      try { await sendInvitationTemplate({ ...privateData, guestName }); } catch (error) { caught = error; }
      expect(getSendDiagnostics(caught).fbtrace_id).toBeUndefined();
    },
  );

  test("distinguishes application failure before sending with no refund or fetch", async () => {
    credits.reserveWhatsAppSendCredit.mockRejectedValue(new Error("database failure private-invite-token"));
    expectPublicFailure(await post());
    expect(diagnostic().failureSource).toBe("application_before_meta_response");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-invite-token");
  });

  test("distinguishes malformed successful HTTP response without assuming acceptance", async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error("invalid JSON"); } });
    expectPublicFailure(await post());
    expect(diagnostic().failureSource).toBe("application_after_meta_http_response");
    expect(diagnostic().httpStatus).toBe(200);
    expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("preserves existing counts and no-refund behavior after acceptance when saving fails", async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ messages: [{ id: "synthetic-message" }] }) });
    invitation.save.mockRejectedValueOnce(new Error("save failed private-invite-token"));
    const response = await post();
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ sent: 1, submitted: 1, failed: 1, skipped: 0 });
    expect(diagnostic().failureSource).toBe("application_after_meta_acceptance");
    expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("leaves successful sends unchanged", async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ messages: [{ id: "synthetic-message" }] }) });
    const response = await post();
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ sent: 1, submitted: 1, failed: 0, skipped: 0,
      results: [{ status: "queued", data: { whatsappMessageId: "synthetic-message" } }] });
    expect(log).not.toHaveBeenCalled();
    expect(credits.refundWhatsAppSendCredit).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("does not trust arbitrary diagnostic properties on application errors", () => {
    const error = Object.assign(new Error("private text"), { diagnostics: { metaMessage: "secret" }, response: { token: "secret" } });
    expect(getSendDiagnostics(error)).toEqual({ failureSource: "application_before_meta_response", metaMessage: "Application processing failed." });
  });
});
