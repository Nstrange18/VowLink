const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");

jest.mock("axios", () => ({}));
jest.mock("../models/Invitation", () => ({ findOne: jest.fn() }));
jest.mock("../models/WhatsAppReminder", () => ({ findOne: jest.fn().mockResolvedValue(null) }));
jest.mock("../models/User", () => ({}));
jest.mock("../models/WhatsAppSendLedger", () => ({}));
jest.mock("../utils/whatsappCloud", () => ({}));
jest.mock("../utils/whatsappCredits", () => ({}));

const Invitation = require("../models/Invitation");
const whatsappRoutes = require("../routes/whatsappRoutes");
const secretNames = ["WHATSAPP_APP_SECRET", "META_APP_SECRET", "FACEBOOK_APP_SECRET"];
const secret = "synthetic-webhook-app-secret";
const payload = {
  entry: [{ changes: [{ value: { statuses: [{ id: "synthetic-message", status: "delivered" }] } }] }],
};
// Deliberate whitespace verifies hashing of received bytes, not reserialized JSON.
const rawBody = JSON.stringify(payload, null, 2);
const signatureFor = (key = secret, body = rawBody) =>
  `sha256=${crypto.createHmac("sha256", key).update(body).digest("hex")}`;

describe("WhatsApp POST webhook signature verification", () => {
  let server;
  let invitation;
  let previousSecrets;
  let warning;
  let info;

  beforeAll(async () => {
    const app = express();
    app.use(express.json({
      verify: (req, _res, buffer) => { req.rawBody = Buffer.from(buffer); },
    }));
    app.use("/api/whatsapp", whatsappRoutes);
    server = http.createServer(app);
    allowTestServer(server);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
  });

  beforeEach(() => {
    previousSecrets = secretNames.map((name) => process.env[name]);
    secretNames.forEach((name) => delete process.env[name]);
    process.env.WHATSAPP_APP_SECRET = secret;
    invitation = {
      _id: "synthetic-invitation",
      whatsappStatus: "sent",
      save: jest.fn().mockResolvedValue(undefined),
    };
    Invitation.findOne.mockReset().mockResolvedValue(invitation);
    warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    info = jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    secretNames.forEach((name, index) => {
      if (previousSecrets[index] === undefined) delete process.env[name];
      else process.env[name] = previousSecrets[index];
    });
    warning.mockRestore();
    info.mockRestore();
  });

  afterAll(async () => {
    if (server?.listening) {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  const post = (signature) => {
    const pending = request(server)
      .post("/api/whatsapp/webhook")
      .set("Content-Type", "application/json")
      .send(rawBody);
    if (signature !== undefined) pending.set("x-hub-signature-256", signature);
    return pending;
  };

  const expectAccepted = async (pending) => {
    const response = await pending;
    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
    expect(Invitation.findOne).toHaveBeenCalledTimes(1);
    expect(Invitation.findOne).toHaveBeenCalledWith({ whatsappMessageId: "synthetic-message" });
    expect(invitation.save).toHaveBeenCalledTimes(1);
    expect(invitation.whatsappStatus).toBe("delivered");
  };

  const postStatuses = (statuses) => {
    const body = JSON.stringify({ entry: [{ changes: [{
      field: "messages", value: { statuses },
    }] }] }, null, 2);
    return request(server).post("/api/whatsapp/webhook")
      .set("Content-Type", "application/json")
      .set("x-hub-signature-256", signatureFor(secret, body))
      .send(body);
  };

  test.each([
    ["sent", "whatsappSentAt"],
    ["delivered", "whatsappDeliveredAt"],
    ["read", "whatsappReadAt"],
    ["failed", "whatsappFailedAt"],
  ])("applies signed messages-field %s status to the invitation matched by wamid", async (status, timestampField) => {
    invitation.whatsappStatus = "queued";
    const started = Date.now();
    const response = await postStatuses([{
      id: "wamid.synthetic-status", status, timestamp: "1600000000",
      errors: status === "failed" ? [{ code: 131000, message: "Synthetic delivery failure" }] : undefined,
    }]);
    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
    expect(Invitation.findOne).toHaveBeenCalledTimes(1);
    expect(Invitation.findOne).toHaveBeenCalledWith({ whatsappMessageId: "wamid.synthetic-status" });
    expect(invitation.save).toHaveBeenCalledTimes(1);
    expect(invitation.whatsappStatus).toBe(status === "failed" ? "technical_failure" : status);
    expect(invitation.whatsappProvider).toBe("cloud_api");
    expect(invitation[timestampField]).toBeInstanceOf(Date);
    expect(invitation[timestampField].getTime()).toBeGreaterThanOrEqual(started);
    expect(invitation[timestampField].getTime()).toBeLessThanOrEqual(Date.now());
    if (status === "sent") {
      expect(invitation.whatsappSentBy).toBe("WhatsApp Cloud API");
      expect(invitation.whatsappFailureReason).toBe("");
    }
    if (status === "failed") {
      expect(invitation.whatsappFailureReason).toBe("We could not send this invite. Please try again.");
    }
  });

  test("preserves an existing sent timestamp when Meta reports sent", async () => {
    const original = new Date("2025-01-01T12:00:00Z");
    invitation.whatsappSentAt = original;
    invitation.whatsappFailureReason = "Previous failure";
    expect((await postStatuses([{ id: "wamid.synthetic-sent", status: "sent" }])).status).toBe(200);
    expect(invitation.whatsappSentAt).toBe(original);
    expect(invitation.whatsappFailureReason).toBe("");
  });

  test.each([
    [{ message: "This message was not delivered to maintain healthy ecosystem engagement." }, "marketing_limited", "WhatsApp temporarily limited marketing delivery to this recipient. Try again later or use manual WhatsApp sharing."],
    [{ title: "Business eligibility payment issue" }, "payment_issue", "WhatsApp could not complete delivery because of a business billing or eligibility issue."],
    [{ error_data: { details: "BUSINESS ELIGIBILITY issue" } }, "payment_issue", "WhatsApp could not complete delivery because of a business billing or eligibility issue."],
    [{ message: "Payment required" }, "payment_issue", "WhatsApp could not complete delivery because of a business billing or eligibility issue."],
    [{ message: "Unknown technical error" }, "technical_failure", "We could not send this invite. Please try again."],
    [undefined, "technical_failure", "We could not send this invite. Please try again."],
  ])("classifies delivery failure %j as %s", async (error, state, message) => {
    const response = await postStatuses([{ id: "wamid.failure", status: "failed", errors: error ? [error] : [] }]);
    expect(response.status).toBe(200);
    expect(invitation.whatsappStatus).toBe(state);
    expect(invitation.whatsappFailureReason).toBe(message);
    expect(invitation.save).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["delivered", "sent"], ["delivered", "failed"],
    ["read", "sent"], ["read", "delivered"], ["read", "failed"],
  ])("preserves %s after a late %s notification", async (current, incoming) => {
    invitation.whatsappStatus = current;
    await postStatuses([{ id: "wamid.late", status: incoming, errors: [{ message: "Payment issue" }] }]);
    expect(invitation.whatsappStatus).toBe(current);
    expect(invitation.whatsappFailedAt).toBeUndefined();
  });

  test("allows delivered to advance to read", async () => {
    invitation.whatsappStatus = "delivered";
    await postStatuses([{ id: "wamid.read", status: "read" }]);
    expect(invitation.whatsappStatus).toBe("read");
  });

  test("acknowledges an unmatched wamid without saving an invitation", async () => {
    Invitation.findOne.mockResolvedValue(null);
    const response = await postStatuses([{ id: "wamid.unmatched", status: "delivered" }]);
    expect(response.status).toBe(200);
    expect(response.text).toBe("OK");
    expect(Invitation.findOne).toHaveBeenCalledWith({ whatsappMessageId: "wamid.unmatched" });
    expect(invitation.save).not.toHaveBeenCalled();
    expect(invitation.whatsappStatus).toBe("sent");
    expect(warning).toHaveBeenCalledWith(
      "[WHATSAPP WEBHOOK] Status update did not match an invitation.",
      expect.objectContaining({ messageId: "wamid.unmatched", status: "delivered" }),
    );
  });

  test("continues to match later statuses after an unmatched wamid in the same notification", async () => {
    Invitation.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(invitation);
    const response = await postStatuses([
      { id: "wamid.unmatched", status: "sent" },
      { id: "wamid.matched", status: "read" },
    ]);
    expect(response.status).toBe(200);
    expect(Invitation.findOne).toHaveBeenNthCalledWith(1, { whatsappMessageId: "wamid.unmatched" });
    expect(Invitation.findOne).toHaveBeenNthCalledWith(2, { whatsappMessageId: "wamid.matched" });
    expect(invitation.save).toHaveBeenCalledTimes(1);
    expect(invitation.whatsappStatus).toBe("read");
  });

  const expectRejected = async (pending) => {
    const response = await pending;
    expect(response.status).toBe(403);
    expect(response.text).toBe("Forbidden");
    expect(Invitation.findOne).not.toHaveBeenCalled();
    expect(invitation.save).not.toHaveBeenCalled();
    expect(invitation.whatsappStatus).toBe("sent");
  };

  test.each(secretNames)("accepts a valid raw-body signature using %s", async (name) => {
    secretNames.forEach((key) => delete process.env[key]);
    process.env[name] = secret;
    await expectAccepted(post(signatureFor()));
  });

  test("uses the first populated alias in the existing priority order", async () => {
    process.env.META_APP_SECRET = "synthetic-meta-secret";
    process.env.FACEBOOK_APP_SECRET = "synthetic-facebook-secret";
    await expectAccepted(post(signatureFor()));
  });

  test("an empty primary secret falls back to Meta before Facebook", async () => {
    process.env.WHATSAPP_APP_SECRET = "";
    process.env.META_APP_SECRET = secret;
    process.env.FACEBOOK_APP_SECRET = "synthetic-facebook-secret";
    await expectAccepted(post(signatureFor()));
  });

  test("empty primary and Meta secrets fall back to Facebook", async () => {
    process.env.WHATSAPP_APP_SECRET = "";
    process.env.META_APP_SECRET = "";
    process.env.FACEBOOK_APP_SECRET = secret;
    await expectAccepted(post(signatureFor()));
  });

  test("does not try a lower-priority alias when the selected secret is wrong", async () => {
    process.env.WHATSAPP_APP_SECRET = "incorrect-configured-secret";
    process.env.META_APP_SECRET = secret;
    await expectRejected(post(signatureFor()));
  });

  test.each([
    ["incorrect digest", () => `sha256=${"0".repeat(64)}`],
    ["signature made with a different secret", () => signatureFor("different-test-secret")],
    ["missing signature", () => undefined],
    ["wrong algorithm prefix", () => signatureFor().replace("sha256=", "sha1=")],
    ["empty digest", () => "sha256="],
    ["short digest", () => "sha256=abcd"],
    ["non-hex digest", () => `sha256=${"z".repeat(64)}`],
    ["reserialized rather than received bytes", () => signatureFor(secret, JSON.stringify(payload))],
    ["valid digest followed by non-hex characters", () => `${signatureFor()}zz`],
    ["valid digest followed by an odd hex nibble", () => `${signatureFor()}a`],
  ])("rejects %s before processing updates", async (_label, makeSignature) => {
    await expectRejected(post(makeSignature()));
  });

  // Missing configuration must never bypass signature verification.
  test.each([undefined, ""])("rejects when all signing secrets are %s", async (value) => {
    secretNames.forEach((name) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
    await expectRejected(post(undefined));
  });

  test.each(secretNames)("rejects a whitespace-only %s even with a matching digest", async (name) => {
    secretNames.forEach((key) => delete process.env[key]);
    process.env[name] = "   ";
    await expectRejected(post(signatureFor("   ")));
  });

  test("fails closed if the signing secret disappears between requests", async () => {
    await expectAccepted(post(signatureFor()));
    delete process.env.WHATSAPP_APP_SECRET;
    Invitation.findOne.mockClear();
    invitation.save.mockClear();
    invitation.whatsappStatus = "sent";

    await expectRejected(post(signatureFor()));
  });
});
