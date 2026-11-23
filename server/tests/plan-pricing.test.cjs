const http = require("node:http");
const crypto = require("node:crypto");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");
jest.mock("../models/User", () => ({ findById: jest.fn(), findOne: jest.fn() }));
jest.mock("../middleware/auth", () => ({ protect: (req, _res, next) => { req.user = { id: "synthetic-owner", email: "owner@example.test" }; next(); } }));
jest.mock("axios", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("cloudinary", () => ({ v2: { config: jest.fn() } }));
jest.mock("../utils/email", () => ({}));
const axios = require("axios");
const User = require("../models/User");
const { PLAN_PRICES_NGN, LEGACY_PLAN_PRICES_NGN, PRICING_VERSION, PRICING_CUTOVER_AT, quoteSignature } = require("../utils/planPricing");
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
  User.findById.mockReset().mockResolvedValue(user); User.findOne.mockReset().mockResolvedValue(user); axios.get.mockReset(); axios.post.mockReset();
  log = jest.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  if (originalKey === undefined) delete process.env.PAYSTACK_SECRET_KEY; else process.env.PAYSTACK_SECRET_KEY = originalKey;
  process.env.NODE_ENV = priorEnv; log.mockRestore();
});
afterAll(async () => { await new Promise(resolve => server.close(resolve)); });
const transaction = (tier, amount) => ({ reference: "synthetic-reference", status: "success", domain: "test", amount, currency: "NGN", customer: { email: user.email }, metadata: { paymentType: "couple_upgrade", tier, userId: user._id, pricingVersion: PRICING_VERSION,
  priceSignature: quoteSignature(key, { tier, userId: user._id, email: user.email, reference: "synthetic-reference", amount: PLAN_PRICES_NGN[tier] * 100 }) } });
const verify = async (tier, amount) => {
  axios.get.mockResolvedValue({ data: { status: true, data: transaction(tier, amount) } });
  return request(server).post("/api/auth/upgrade/verify").send({ tier, reference: "synthetic-reference" });
};
const webhook = data => {
  const body = { event: "charge.success", data };
  const signature = crypto.createHmac("sha512", key).update(JSON.stringify(body)).digest("hex");
  return request(server).post("/api/auth/paystack/webhook").set("x-paystack-signature", signature).send(body);
};
test("current plan prices are Pro 3000, Plus 2000, Free/Classic 1500", () => {
  expect(PLAN_PRICES_NGN).toEqual({ free: 1500, plus: 2000, pro: 3000 });
});
test.each([["pro", 300000], ["plus", 200000], ["free", 150000]])("callback accepts correct %s price", async (tier, amount) => {
  expect((await verify(tier, amount)).status).toBe(200); expect(user.tier).toBe(tier === "free" ? "plus" : tier); expect(user.save).toHaveBeenCalledTimes(1);
});
test.each([299999, 300001, 285000, 315000, 12000000])("callback rejects incorrect Pro amount %i", async amount => {
  expect((await verify("pro", amount)).status).toBe(400); expect(user.tier).toBe("plus"); expect(user.save).not.toHaveBeenCalled();
});
test.each([["pro", 300000], ["plus", 200000], ["free", 150000]])("signed webhook activates %s at its correct price", async (tier, amount) => {
  expect((await webhook(transaction(tier, amount))).status).toBe(200); expect(user.tier).toBe(tier === "free" ? "plus" : tier); expect(user.save).toHaveBeenCalledTimes(1); expect(axios.get).not.toHaveBeenCalled();
});
test.each([299999, 300001, 12000000])("signed webhook does not activate incorrect Pro amount %i", async amount => {
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

test.each(["free", "plus"])("replaying a valid older %s purchase never downgrades Pro or changes balances", async tier => {
  user.tier = "pro"; user.whatsappCloudExtraSends = 250;
  const data = transaction(tier, LEGACY_PLAN_PRICES_NGN[tier] * 100);
  delete data.metadata.pricingVersion; delete data.metadata.priceSignature;
  data.created_at = new Date(Date.parse(PRICING_CUTOVER_AT) - 1).toISOString();
  axios.get.mockResolvedValue({ data: { status: true, data } });
  expect((await request(server).post("/api/auth/upgrade/verify").send({ tier, reference: data.reference })).status).toBe(200);
  await webhook(data);
  expect(user.tier).toBe("pro"); expect(user.whatsappCloudExtraSends).toBe(250);
  expect((await request(server).post("/api/auth/upgrade/initialize").send({ tier })).status).toBe(409);
  expect(axios.post).not.toHaveBeenCalled();
});

test("public catalog exposes current amounts without credentials", async () => {
  const response = await request(server).get("/api/auth/pricing");
  expect(response.status).toBe(200); expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.body.amounts).toEqual({ free: 150000, plus: 200000, pro: 300000 });
  expect(JSON.stringify(response.body)).not.toContain(key);
});
test.each(["free", "plus", "pro"])("server initializes %s from the authoritative catalog and signs its quote", async tier => {
  user.tier = "unpaid"; user.whatsappCloudExtraSends = 250;
  axios.post.mockImplementation(async (_url, body) => ({ data: { status: true, data: { reference: body.reference, access_code: "synthetic-access", authorization_url: "https://checkout.paystack.com/synthetic-access" } } }));
  const response = await request(server).post("/api/auth/upgrade/initialize").send({ tier });
  expect(response.status).toBe(200);
  const body = axios.post.mock.calls[0][1];
  expect(body).toMatchObject({ amount: PLAN_PRICES_NGN[tier] * 100, currency: "NGN", email: user.email, metadata: { tier, userId: user._id, pricingVersion: PRICING_VERSION } });
  expect(body).not.toHaveProperty("plan"); expect(body).not.toHaveProperty("planCode");
  expect(body.metadata.priceSignature).toBe(quoteSignature(key, { tier, userId: user._id, email: user.email, reference: body.reference, amount: body.amount }));
  expect(response.body).toMatchObject({ amount: body.amount, currency: "NGN", accessCode: "synthetic-access" });
  expect(user.save).not.toHaveBeenCalled(); expect(user.whatsappCloudExtraSends).toBe(250);
});
test.each(["USD", "EUR", "GBP", "GHS", "KES", "ZAR", "CAD", "AUD", "XYZ"])("rejects unsupported charge currency %s before provider initialization", async currency => {
  expect((await request(server).post("/api/auth/upgrade/initialize").send({ tier: "pro", currency })).status).toBe(400); expect(axios.post).not.toHaveBeenCalled();
});
test.each([{ amount: 1 }, { price: 1 }, { userId: "foreign" }, { workspaceId: "foreign-event" }, { metadata: { tier: "pro" } }])("rejects injected price/ownership claims %j", async extra => {
  expect((await request(server).post("/api/auth/upgrade/initialize").send({ tier: "pro", ...extra })).status).toBe(400); expect(axios.post).not.toHaveBeenCalled();
});
test("provider failure and duplicate purchase preserve entitlements and credits", async () => {
  user.whatsappCloudExtraSends = 250; axios.post.mockRejectedValue(new Error("Synthetic provider failure"));
  expect((await request(server).post("/api/auth/upgrade/initialize").send({ tier: "pro" })).status).toBe(502);
  expect(user.tier).toBe("plus"); expect(user.whatsappCloudExtraSends).toBe(250); expect(user.save).not.toHaveBeenCalled();
  expect((await request(server).post("/api/auth/upgrade/initialize").send({ tier: "plus" })).status).toBe(409);
});
test.each(["free", "plus", "pro"])("rejects one-kobo under/overpayment for %s in callback and webhook", async tier => {
  for (const offset of [-1, 1]) { expect((await verify(tier, PLAN_PRICES_NGN[tier] * 100 + offset)).status).toBe(400); await webhook(transaction(tier, PLAN_PRICES_NGN[tier] * 100 + offset)); }
  expect(user.save).not.toHaveBeenCalled();
});
test.each(["USD", "EUR", "GBP", "GHS", "KES", "ZAR", "CAD", "AUD", "XYZ"])("callback and webhook reject %s even with a valid quote", async currency => {
  const data = { ...transaction("pro", 300000), currency }; axios.get.mockResolvedValue({ data: { status: true, data } });
  expect((await request(server).post("/api/auth/upgrade/verify").send({ tier: "pro", reference: data.reference })).status).toBe(400);
  await webhook(data); expect(user.save).not.toHaveBeenCalled();
});
test.each(["owner", "signature", "version", "mode", "status"])("callback and webhook reject tampered %s", async field => {
  const data = transaction("pro", 300000);
  if (field === "owner") data.metadata.userId = "foreign";
  if (field === "signature") data.metadata.priceSignature = "a".repeat(64);
  if (field === "version") data.metadata.pricingVersion = "forged";
  if (field === "mode") data.domain = "live";
  if (field === "status") data.status = "failed";
  axios.get.mockResolvedValue({ data: { status: true, data } });
  expect((await request(server).post("/api/auth/upgrade/verify").send({ tier: "pro", reference: data.reference })).status).toBe(400);
  await webhook(data); expect(user.save).not.toHaveBeenCalled();
});
test.each(["free", "plus", "pro"])("honors pre-change %s checkouts at their exact original amount, rejecting post-cutover legacy prices", async tier => {
  const data = transaction(tier, LEGACY_PLAN_PRICES_NGN[tier] * 100);
  delete data.metadata.pricingVersion; delete data.metadata.priceSignature;
  data.created_at = new Date(Date.parse(PRICING_CUTOVER_AT) - 1).toISOString();
  const snapshot = JSON.stringify(data);
  axios.get.mockResolvedValue({ data: { status: true, data } });
  expect((await request(server).post("/api/auth/upgrade/verify").send({ tier, reference: data.reference })).status).toBe(200);
  await webhook(data); expect(JSON.stringify(data)).toBe(snapshot);
  user.save.mockClear(); data.created_at = PRICING_CUTOVER_AT;
  expect((await request(server).post("/api/auth/upgrade/verify").send({ tier, reference: data.reference })).status).toBe(400);
  await webhook(data); expect(user.save).not.toHaveBeenCalled();
});
