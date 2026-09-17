const http = require("node:http");
const crypto = require("node:crypto");
const { inspect } = require("node:util");
const express = require("express");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");

jest.mock("../models/User", () => ({ findOne: jest.fn() }));
jest.mock("@sendgrid/mail", () => ({ setApiKey: jest.fn(), send: jest.fn() }));
jest.mock("../utils/email", () => ({}));
jest.mock("axios", () => ({}));
jest.mock("cloudinary", () => ({ v2: { config: jest.fn() } }));
jest.mock("../utils/whatsappCredits", () => ({}));
// Rate limiting is outside this logging test; avoid shared counters across cases.
jest.mock("express-rate-limit", () => () => (_req, _res, next) => next());

const User = require("../models/User");
const sgMail = require("@sendgrid/mail");
const authRoutes = require("../routes/authRoutes");
const email = "reset-user@example.test";
const tokenBytes = Buffer.alloc(32, 0xab);
const token = tokenBytes.toString("hex");
const resetUrl = `https://reset.example.test/admin/reset-password/${token}`;
const providerDetail = "synthetic-private-provider-body";
const now = 1_800_000_000_000;
const genericResponse = { message: "If that email exists, a reset link has been sent." };
const envNames = ["NODE_ENV", "SENDGRID_API_KEY", "PUBLIC_SITE_URL", "CLIENT_URL", "FRONTEND_URL"];

describe("password-reset logging", () => {
  let server;
  let user;
  let priorEnv;
  let logs;
  let clock;
  let random;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    server = http.createServer(app);
    allowTestServer(server);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
  });

  beforeEach(() => {
    priorEnv = envNames.map((name) => process.env[name]);
    envNames.forEach((name) => delete process.env[name]);
    process.env.NODE_ENV = "test";
    process.env.SENDGRID_API_KEY = "synthetic-test-key";
    process.env.PUBLIC_SITE_URL = "https://reset.example.test/";
    user = { email, save: jest.fn().mockResolvedValue(undefined) };
    User.findOne.mockReset().mockResolvedValue(user);
    sgMail.send.mockReset().mockResolvedValue([{ statusCode: 202 }]);
    logs = ["log", "warn", "error", "info", "debug"].map((method) =>
      jest.spyOn(console, method).mockImplementation(() => {}),
    );
    clock = jest.spyOn(Date, "now").mockReturnValue(now);
    random = jest.spyOn(crypto, "randomBytes").mockReturnValue(tokenBytes);
  });

  afterEach(() => {
    logs.forEach((spy) => spy.mockRestore());
    clock.mockRestore();
    random.mockRestore();
    envNames.forEach((name, index) => {
      if (priorEnv[index] === undefined) delete process.env[name];
      else process.env[name] = priorEnv[index];
    });
  });

  afterAll(async () => {
    if (server?.listening) {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  const forgot = () => request(server).post("/api/auth/forgot-password").send({ email });

  test("preserves token generation, one-hour expiry, recipient, and reset link delivery", async () => {
    const response = await forgot();

    expect(response.status).toBe(200);
    expect(response.body).toEqual(genericResponse);
    expect(random).toHaveBeenCalledWith(32);
    expect(user.resetPasswordToken).toBe(token);
    expect(user.resetPasswordExpires).toEqual(new Date(now + 60 * 60 * 1000));
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
      to: email,
      subject: "Reset your VowLink password",
      html: expect.stringContaining(`href="${resetUrl}"`),
    }));
  });

  test("preserves token storage and generic success when email is unconfigured", async () => {
    delete process.env.SENDGRID_API_KEY;

    const response = await forgot();

    expect(response.status).toBe(200);
    expect(response.body).toEqual(genericResponse);
    expect(user.resetPasswordToken).toBe(token);
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test("a delivered token still resets the password and clears reset fields", async () => {
    await forgot();
    const password = "synthetic-reset-password";
    const response = await request(server)
      .post(`/api/auth/reset-password/${token}`)
      .send({ password });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Password reset successfully. You can now log in." });
    expect(User.findOne).toHaveBeenLastCalledWith({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: expect.any(Date) },
    });
    expect(await bcrypt.compare(password, user.password)).toBe(true);
    expect(user.resetPasswordToken).toBeNull();
    expect(user.resetPasswordExpires).toBeNull();
    expect(user.save).toHaveBeenCalledTimes(2);
  });

  // Sensitive data must stay out of logs in every environment and outcome.
  describe.each(["development", "production"])("%s logging", (environment) => {
    test.each([
      "delivery success",
      "email unconfigured",
      "unknown account",
      "provider error message",
      "provider error object",
      "database error object",
    ])("keeps operational logs without sensitive data: %s", async (scenario) => {
      process.env.NODE_ENV = environment;
      if (scenario === "email unconfigured") delete process.env.SENDGRID_API_KEY;
      if (scenario === "unknown account") User.findOne.mockResolvedValue(null);
      if (scenario === "provider error message") {
        sgMail.send.mockRejectedValue(new Error(`${email} ${resetUrl} ${providerDetail}`));
      }
      if (scenario === "provider error object") {
        sgMail.send.mockRejectedValue({ response: { body: { email, token, resetUrl, providerDetail } } });
      }
      if (scenario === "database error object") {
        User.findOne.mockRejectedValue(Object.assign(new Error("Synthetic database failure"), {
          context: { email, token, resetUrl, providerDetail },
        }));
      }

      const response = await forgot();

      expect(response.status).toBe(scenario === "database error object" ? 500 : 200);
      if (response.status === 200) expect(response.body).toEqual(genericResponse);
      const output = inspect(logs.flatMap((spy) => spy.mock.calls), { depth: null });
      expect(logs.some((spy) => spy.mock.calls.length > 0)).toBe(true);
      for (const sensitiveValue of [token, resetUrl, email, providerDetail]) {
        expect(output).not.toContain(sensitiveValue);
      }
    });
  });
});
