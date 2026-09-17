const http = require("node:http");
const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { protect } = require("../middleware/auth");
const { allowTestServer } = require("./setup.cjs");

const NOW = 1_800_000_000;
const identity = {
  id: "synthetic-user-id",
  email: "couple@example.test",
  partner1Name: "Alex",
  partner2Name: "Sam",
};

const sign = (claims = {}, secret = process.env.JWT_SECRET) =>
  jwt.sign({ ...identity, iat: NOW, exp: NOW + 60, ...claims }, secret);

describe("authentication middleware", () => {
  let server;
  let reachedHandler;
  let clock;

  beforeAll(async () => {
    const app = express();
    reachedHandler = jest.fn((req, res) => res.json({ user: req.user }));
    app.get("/protected", protect, reachedHandler);
    server = http.createServer(app);
    allowTestServer(server);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
  });

  beforeEach(() => {
    reachedHandler.mockClear();
    clock = jest.spyOn(Date, "now").mockReturnValue(NOW * 1000);
  });

  afterEach(() => clock.mockRestore());

  afterAll(async () => {
    if (server?.listening) {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  test.each([
    ["missing Authorization header", undefined],
    ["unsupported authentication scheme", "Basic synthetic-credentials"],
    ["lowercase bearer scheme", "bearer synthetic-token"],
    ["Bearer without a token", "Bearer"],
  ])("rejects %s", async (_label, header) => {
    const pending = request(server).get("/protected");
    if (header !== undefined) pending.set("Authorization", header);

    const response = await pending;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Not authorised. No token." });
    expect(reachedHandler).not.toHaveBeenCalled();
  });

  test.each([
    ["malformed token", () => "not.a.valid-jwt"],
    ["expired token", () => sign({ exp: NOW - 1 })],
    ["token at its expiration boundary", () => sign({ exp: NOW })],
    ["incorrectly signed token", () => sign({}, "another-test-only-secret")],
    ["token not yet active", () => sign({ nbf: NOW + 1 })],
  ])("rejects %s", async (_label, makeToken) => {
    const response = await request(server)
      .get("/protected")
      .set("Authorization", `Bearer ${makeToken()}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Not authorised. Invalid token." });
    expect(reachedHandler).not.toHaveBeenCalled();
  });

  test("passes a valid token's decoded identity to the protected handler", async () => {
    const response = await request(server)
      .get("/protected")
      .set("Authorization", `Bearer ${sign()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ user: { ...identity, iat: NOW, exp: NOW + 60 } });
    expect(reachedHandler).toHaveBeenCalledTimes(1);
  });

  // protect authenticates the token; role restrictions belong to route logic.
  test.each(["couple", "admin", "unrecognized-test-role"])(
    "passes through the %s role without imposing authorization rules",
    async (role) => {
      const response = await request(server)
        .get("/protected")
        .set("Authorization", `Bearer ${sign({ role })}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({ ...identity, role, iat: NOW, exp: NOW + 60 });
      expect(reachedHandler).toHaveBeenCalledTimes(1);
    },
  );
});
