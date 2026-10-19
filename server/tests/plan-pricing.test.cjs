const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");
jest.mock("../models/User", () => ({ findById: jest.fn(), findOne: jest.fn() }));
jest.mock("../middleware/auth", () => ({ protect: (req, _res, next) => { req.user = { id: "synthetic-owner", email: "owner@example.test" }; next(); } }));
jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("cloudinary", () => ({ v2: { config: jest.fn() } }));
jest.mock("../utils/email", () => ({}));
const axios = require("axios");
const User = require("../models/User");
const { PLAN_PRICES_NGN } = require("../utils/planPricing");
const router = require("../routes/authRoutes");
const key = "sk_test_synthetic_pricing_only";
let server, user, originalKey, priorEnv, log;
beforeAll(async () => {
  const app = express(); app.use(express.json()); app.use("/api/auth", router);
  server = http.createServer(app); allowTestServer(server);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
});
beforeEach(() => {
  originalKey = process.env.PAYSTACK_SECRET_KEY; priorEnv = process.env.NODE_ENV;
  process.env.PAYSTACK_SECRET_KEY = key; process.env.NODE_ENV = "production";
  user = { _id: "synthetic-owner", email: "owner@example.test", tier: "plus", save: jest.fn().mockResolvedValue() };
  User.findById.mockReset().mockResolvedValue(user); User.findOne.mockReset().mockResolvedValue(user); axios.get.mockReset();
  log = jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  if (originalKey === undefined) delete process.env.PAYSTACK_SECRET_KEY; else process.env.PAYSTACK_SECRET_KEY = originalKey;
  process.env.NODE_ENV = priorEnv; log.mockRestore();
});
afterAll(async () => { await new Promise(resolve => server.close(resolve)); });
const transaction = (tier, amount) => ({ reference: "synthetic-reference", status: "success", domain: "test", amount, currency: "NGN", customer: { email: user.email }, metadata: { paymentType: "couple_upgrade", tier, userId: user._id } });
const verify = async (tier, amount) => {
  axios.get.mockResolvedValue({ data: { status: true, data: transaction(tier, amount) } });
  return request(server).post("/api/auth/upgrade/verify").send({ tier, reference: "synthetic-reference" });
};
const webhook = data => {
  const body = { event: "charge.success", data };
  const signature = crypto.createHmac("sha512", key).update(JSON.stringify(body)).digest("hex");
  return request(server).post("/api/auth/paystack/webhook").set("x-paystack-signature", signature).send(body);
};
test("current plan prices are Pro 80000, Plus 68000, Free/Classic 30000", () => {
  expect(PLAN_PRICES_NGN).toEqual({ free: 30000, plus: 68000, pro: 80000 });
});
test.each([["pro", 8000000], ["plus", 6800000], ["free", 3000000]])("callback accepts correct %s price", async (tier, amount) => {
  expect((await verify(tier, amount)).status).toBe(200); expect(user.tier).toBe(tier); expect(user.save).toHaveBeenCalledTimes(1);
});
test.each([7999999, 8000001, 7600000, 8400000, 12000000])("callback rejects incorrect Pro amount %i", async amount => {
  expect((await verify("pro", amount)).status).toBe(400); expect(user.tier).toBe("plus"); expect(user.save).not.toHaveBeenCalled();
});
test.each([["pro", 8000000], ["plus", 6800000], ["free", 3000000]])("signed webhook activates %s at its correct price", async (tier, amount) => {
  expect((await webhook(transaction(tier, amount))).status).toBe(200); expect(user.tier).toBe(tier); expect(user.save).toHaveBeenCalledTimes(1); expect(axios.get).not.toHaveBeenCalled();
});
test.each([7999999, 8000001, 12000000])("signed webhook does not activate incorrect Pro amount %i", async amount => {
  expect((await webhook(transaction("pro", amount))).status).toBe(200); expect(user.tier).toBe("plus"); expect(user.save).not.toHaveBeenCalled();
});
test("historical successful amount is not rewritten and an existing Pro user remains Pro", async () => {
  user.tier = "pro";
  // Old successful purchases are not a second valid price for new purchases.
  const historical = transaction("pro", 12000000);
  const snapshot = JSON.stringify(historical);
  axios.get.mockResolvedValue({ data: { status: true, data: historical } });
  const response = await request(server).post("/api/auth/upgrade/verify").send({ tier: "pro", reference: historical.reference });
  expect(response.status).toBe(400);
  await webhook(historical);
  expect(JSON.stringify(historical)).toBe(snapshot); expect(user.tier).toBe("pro"); expect(user.save).not.toHaveBeenCalled();
});
