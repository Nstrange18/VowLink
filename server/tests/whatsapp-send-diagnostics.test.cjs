const http = require("node:http");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");

jest.mock("axios", () => ({}));
jest.mock("../middleware/auth", () => ({ protect: (req, _res, next) => {
  req.user = { id: "synthetic-user" }; next();
} }));
jest.mock("../models/Invitation", () => ({ find: jest.fn(), findOne: jest.fn() }));
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
  WHATSAPP_URL_BUTTON_VALUE_MODE: "slug",
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
    Invitation.findOne.mockResolvedValue(invitation);
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
          slug: "private-invite-token", whatsappStatus: "technical_failure", whatsappProvider: "cloud_api",
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
      metaDetails: "Meta rejected the send; provider text withheld for privacy.",
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
    for (const value of [environment.WHATSAPP_ACCESS_TOKEN, environment.WHATSAPP_APP_SECRET,
      environment.META_APP_SECRET, environment.FACEBOOK_APP_SECRET, environment.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
      ...Object.values(privateData), "private-invite-token", "person@example.invalid", "confidential"]) {
      expect(output).not.toContain(value);
    }
    expect(diagnostic().metaMessage).toContain("synthetic-phone-id");
    expect(diagnostic().metaMessage).not.toBe("Meta rejected the send; provider text withheld for privacy.");
    expect(diagnostic().metaType).toBeUndefined();
    expect(diagnostic().fbtrace_id).toBeUndefined();
    expect(Object.keys(diagnostic()).sort()).toEqual([
      "failureSource", "httpStatus", "metaCode", "metaSubcode", "metaType", "metaMessage", "metaDetails", "fbtrace_id",
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

  test.each([privateData.to, "SyntheticGuest", "person@example.invalid", "private-invite-token"])(
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

  test("retains distinct provider message and component details only in private diagnostics", async () => {
    metaFailure(400, {
      code: 132012, error_subcode: 123,
      message: "Parameter format does not match format in the created template",
      error_data: { details: "header: Format mismatch, expected IMAGE, received UNKNOWN" },
    });
    const response = await post();
    expectPublicFailure(response);
    expect(diagnostic()).toMatchObject({
      metaMessage: "Parameter format does not match format in the created template",
      metaDetails: "header: Format mismatch, expected IMAGE, received UNKNOWN",
      metaCode: 132012, metaSubcode: 123, fbtrace_id: "SyntheticTrace_123",
    });
    expect(JSON.stringify(response.body)).not.toMatch(/Format mismatch|132012|SyntheticTrace/);
  });

  test("redacts known identities, tokens, URLs, emails and phone numbers from both text fields", async () => {
    const echoed = `Could not deliver to ${privateData.guestName} (${privateData.to}); ${privateData.inviteLink}; person@example.invalid; ${environment.WHATSAPP_APP_SECRET}`;
    metaFailure(400, { message: echoed, error_data: { details: echoed } });
    await post();
    const output = JSON.stringify(log.mock.calls);
    for (const value of [privateData.guestName, privateData.to, privateData.inviteLink,
      "private-invite-token", "person@example.invalid", environment.WHATSAPP_APP_SECRET]) expect(output).not.toContain(value);
    expect(diagnostic().metaMessage).toContain("Could not deliver to [REDACTED]");
    expect(diagnostic().metaDetails).toContain("Could not deliver to [REDACTED]");
  });

  test("logs sanitized structured diagnostics for single sends without leaking provider text publicly", async () => {
    metaFailure(400, { message: "Error validating access token", error_data: { details: "Synthetic diagnostic detail" } });
    const response = await request(server).post("/api/whatsapp/send/synthetic-invitation").send({});
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "We could not send this invite. Please try again." });
    expect(log).toHaveBeenCalledWith("[WHATSAPP SEND] Single invite failed:", expect.objectContaining({
      metaMessage: "Error validating access token", metaDetails: "Synthetic diagnostic detail", metaCode: 131042,
    }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
  });

  test("invalid slug failure keeps bulk results generic and refunds without making a Meta request", async () => {
    invitation.slug = "{{1}}invalid";
    const response = await post();
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ submitted: 0, failed: 1,
      results: [{ message: "We could not send this invite. Please try again." }] });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(credits.refundWhatsAppSendCredit).toHaveBeenCalledTimes(1);
    expect(diagnostic().failureSource).toBe("application_before_meta_response");
  });

  test("preserves ordinary Meta text, braces, parameter names and phone-number IDs exactly", async () => {
    const message = "Parameter format does not match format in the created template";
    const details = "vowlink_invitation: guest_name, invite_message; {{1}}; phone_number_id=1494125895857096; authorization parameter is missing";
    metaFailure(400, { message, error_data: { details }, code: 100, error_subcode: 33,
      type: "OAuthException", fbtrace_id: "AKTyFA7d90kpBqQt8nraJIG" });
    const response = await post();
    expect(response.status).toBe(200);
    expect(response.body.results[0].message).toBe("Check this guest's WhatsApp number and try again.");
    expect(diagnostic()).toMatchObject({ metaMessage: message, metaDetails: details,
      metaCode: 100, metaSubcode: 33, metaType: "OAuthException", fbtrace_id: "AKTyFA7d90kpBqQt8nraJIG" });
    expect(JSON.stringify(response.body)).not.toContain(details);
  });

  test("redacts credential values inside text without discarding the surrounding diagnostic", async () => {
    const message = 'Invalid parameter {"access_token":"synthetic-unknown-access","app_secret":"synthetic-unknown-app","webhook_secret":"synthetic-unknown-webhook"}; guest_name is required';
    const details = 'Request rejected; Authorization: Bearer synthetic-unknown-bearer; invite_message is required';
    metaFailure(400, { message, error_data: { details } });
    await post();
    expect(diagnostic().metaMessage).toBe('Invalid parameter {"access_token":[REDACTED],"app_secret":[REDACTED],"webhook_secret":[REDACTED]}; guest_name is required');
    expect(diagnostic().metaDetails).toBe('Request rejected; Authorization: [REDACTED]; invite_message is required');
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/synthetic-unknown-(access|app|webhook|bearer)/);
  });

  test("preserves long numeric trace IDs rather than treating them as phone numbers", async () => {
    metaFailure(400, { fbtrace_id: "Trace1494125895857096" });
    await post();
    expect(diagnostic().fbtrace_id).toBe("Trace1494125895857096");
  });
});
