const http = require("node:http");
const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");

// Import the actual router without loading database models or provider clients.
jest.mock("../models/User", () => ({ findOne: jest.fn() }));
jest.mock("@sendgrid/mail", () => ({ setApiKey: jest.fn() }));
jest.mock("../utils/email", () => ({}));
jest.mock("axios", () => ({}));
jest.mock("cloudinary", () => ({ v2: { config: jest.fn() } }));
jest.mock("../utils/whatsappCredits", () => ({}));

const User = require("../models/User");
const authRoutes = require("../routes/authRoutes");

// This is the route's existing allowlisted address; no real account is loaded.
const allowedEmail = "nwubachukwuemelie@gmail.com";
const endpoint = "/api/auth/make-admin-dev";
const disabledResponse = { message: "Development admin seeding is disabled." };

describe("development admin seeding", () => {
  let server;
  let user;
  let previousNodeEnv;

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
    previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    user = {
      _id: "synthetic-admin-id",
      email: allowedEmail,
      role: "couple",
      save: jest.fn().mockResolvedValue(undefined),
    };
    User.findOne.mockReset().mockResolvedValue(user);
  });

  afterEach(() => {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  afterAll(async () => {
    if (server?.listening) {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  test("development: unauthenticated seeding normalizes the allowlisted email", async () => {
    const email = ` ${allowedEmail.toUpperCase()} `;
    const response = await request(server).post(endpoint).send({ email });

    expect(response.status).toBe(200);
    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(User.findOne).toHaveBeenCalledWith({ email: allowedEmail });
    expect(user.role).toBe("admin");
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({
      message: `${email} is now a Super Admin! `,
      user: { _id: "synthetic-admin-id", email: allowedEmail, role: "admin" },
    });
  });

  test("development: missing email is rejected before a database lookup", async () => {
    const response = await request(server).post(endpoint).send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Email is required." });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(user.save).not.toHaveBeenCalled();
  });

  test("development: an account outside the allowlist cannot be promoted", async () => {
    const response = await request(server).post(endpoint).send({ email: "other@example.test" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: `Access denied. Only ${allowedEmail} can be elevated to Super Admin.`,
    });
    expect(User.findOne).not.toHaveBeenCalled();
    expect(user.save).not.toHaveBeenCalled();
  });

  test("development: a missing allowlisted account returns not found", async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(server).post(endpoint).send({ email: allowedEmail });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "User not found." });
    expect(user.save).not.toHaveBeenCalled();
  });

  test("development: save failure retains the current error response", async () => {
    user.save.mockRejectedValue(new Error("Synthetic save failure"));

    const response = await request(server).post(endpoint).send({ email: allowedEmail });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Seeding failed", error: "Synthetic save failure" });
  });

  // Only an explicit development environment may perform admin seeding.
  describe.each(["production", undefined, "test", "staging", "unrecognized"])(
    "disabled when NODE_ENV is %s",
    (environment) => {
      test.each([false, true])("denies access before querying users (admin token: %s)", async (withToken) => {
        if (environment === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = environment;

        const pending = request(server).post(endpoint).send({ email: allowedEmail });
        if (withToken) {
          const token = jwt.sign(
            { id: "synthetic-requester", role: "admin" },
            process.env.JWT_SECRET,
            { noTimestamp: true },
          );
          pending.set("Authorization", `Bearer ${token}`);
        }
        const response = await pending;

        expect(response.status).toBe(403);
        expect(response.body).toEqual(disabledResponse);
        expect(User.findOne).not.toHaveBeenCalled();
        expect(user.save).not.toHaveBeenCalled();
        expect(user.role).toBe("couple");
      });
    },
  );
});
