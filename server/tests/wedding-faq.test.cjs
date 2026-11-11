const http = require("node:http");
const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");
jest.mock("../models/User", () => ({ findById: jest.fn() }));
jest.mock("../models/Invitation", () => ({ findOne: jest.fn() }));
jest.mock("../utils/rsvpState", () => ({ findCurrentRsvp: jest.fn().mockResolvedValue(null) }));
jest.mock("../utils/email", () => ({}));
jest.mock("axios", () => ({}));
jest.mock("cloudinary", () => ({ v2: { config: jest.fn() } }));
jest.mock("../utils/whatsappCredits", () => ({}));
const User = require("../models/User");
const ActualUser = jest.requireActual("../models/User");
const Invitation = require("../models/Invitation");
const { parseWeddingSitePatch, publicWeddingSite } = require("../utils/weddingSite");
const item = { question: "Where can we park?", answer: "Use the venue car park." };
let server, user;
beforeAll(async () => {
  const app = express(); app.use(express.json());
  app.use("/auth", require("../routes/authRoutes"));
  app.use("/invitations", require("../routes/invitationRoutes"));
  server = http.createServer(app); allowTestServer(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
});
afterAll(async () => { await new Promise((resolve) => server.close(resolve)); });
beforeEach(() => {
  user = new ActualUser({ partner1Name: "Test", partner2Name: "Couple", email: "faq@example.test", password: "synthetic", tier: "pro", venue: "Existing venue", galleryPhotos: ["/photo.jpg"] });
  user.save = jest.fn().mockResolvedValue(user);
  User.findById.mockResolvedValue(user);
  Invitation.findOne.mockReturnValue({ populate: async () => ({ _id: "invitation", checkInToken: "synthetic-check-in", userId: user,
    toObject: () => ({ userId: user.toObject() }) }) });
});
const update = (body) => request(server).put("/auth/me").set("Authorization", `Bearer ${jwt.sign({ id: "owner" }, process.env.JWT_SECRET)}`).send(body);
test("legacy users have no weddingSite; supplied empty subdocument defaults to disabled", () => {
  expect(user.weddingSite).toBeUndefined();
  user.weddingSite = {};
  expect(user.weddingSite.faq.enabled).toBe(false);
  expect(user.weddingSite.faq.items).toHaveLength(0);
});
test("FAQ settings require authentication", async () => { expect((await request(server).put("/auth/me").send({ weddingSite: {} })).status).toBe(401); });
test("FAQ-only save trims data, preserves wedding settings and excludes FAQ from JWT", async () => {
  const response = await update({ weddingSite: { faq: { enabled: true, items: [{ question: " Where? ", answer: " Here. " }] } } });
  expect(response.status).toBe(200);
  expect(user.weddingSite.faq.items[0].toObject()).toEqual({ question: "Where?", answer: "Here." });
  expect(user.venue).toBe("Existing venue"); expect(user.galleryPhotos).toEqual(["/photo.jpg"]);
  expect(jwt.decode(response.body.accessToken)).not.toHaveProperty("weddingSite");
});
test("add, edit, delete, and disable preserve array order", async () => {
  expect((await update({ weddingSite: { faq: { enabled: true, items: [item, { question: "Dress?", answer: "Formal." }] } } })).status).toBe(200);
  await update({ weddingSite: { faq: { items: [{ question: "Dress?", answer: "Casual." }] } } });
  expect(user.weddingSite.faq.enabled).toBe(true);
  expect(user.weddingSite.faq.items[0].answer).toBe("Casual.");
  await update({ weddingSite: { faq: { enabled: false } } });
  expect(user.weddingSite.faq.items).toHaveLength(1);
  await update({ weddingSite: { faq: { items: [] } } });
  expect(user.weddingSite.faq.items).toHaveLength(0);
});
test("older clients omitting weddingSite do not erase FAQ", async () => {
  user.weddingSite = { faq: { enabled: true, items: [item] } };
  expect((await update({ venue: "Updated venue" })).status).toBe(200);
  expect(user.weddingSite.faq.items[0].question).toBe(item.question);
});
test.each(["unpaid", "free", "plus", "pro"])("FAQ-only save preserves all other %s settings", async (tier) => {
  user.tier = tier;
  user.registryEnabled = true;
  const before = user.toObject();
  expect((await update({ weddingSite: { faq: { items: [item] } } })).status).toBe(200);
  const after = user.toObject();
  delete after.weddingSite;
  expect(after).toEqual(before);
});
test.each([null, [], "bad", { faq: null }, { faq: { enabled: "true" } }, { faq: { items: {} } },
  { faq: { items: [null] } }, { faq: { items: [{ question: 1, answer: "Text" }] } },
  { faq: { items: [{ question: " ", answer: "Text" }] } }, { faq: { items: [{ ...item, extra: "bad" }] } },
  { faq: { items: Array(11).fill(item) } }, { faq: { items: [{ ...item, question: "x".repeat(201) }] } },
  { faq: { items: [{ ...item, answer: "x".repeat(1501) }] } }, { story: "Not supported" }])("malformed or over-limit FAQ rejected: %j", async (weddingSite) => {
  const response = await update({ weddingSite });
  expect(response.status).toBe(400); expect(user.save).not.toHaveBeenCalled();
});
test("exact validation limits accepted; schema also enforces item and text bounds", async () => {
  const items = Array.from({ length: 10 }, () => ({ question: "q".repeat(200), answer: "a".repeat(1500) }));
  expect(parseWeddingSitePatch({ faq: { items } }).items).toHaveLength(10);
  user.weddingSite = { faq: { items: Array(11).fill(item) } };
  await expect(user.validate()).rejects.toThrow();
  user.weddingSite = { faq: { items: [{ ...item, answer: "a".repeat(1501) }] } };
  await expect(user.validate()).rejects.toThrow();
});
test.each([undefined, { faq: { enabled: false, items: [item] } }, { faq: { enabled: true, items: [] } }])("public endpoint omits unpublished/empty/legacy FAQ: %j", async (site) => {
  user.weddingSite = site;
  const response = await request(server).get("/invitations/slug/test");
  expect(response.status).toBe(200); expect(response.body.userId).not.toHaveProperty("weddingSite");
  expect(JSON.stringify(response.body)).not.toContain(item.answer);
});
test("public endpoint explicitly projects only published valid FAQ", async () => {
  user.weddingSite = { faq: { enabled: true, items: [item] } };
  const response = await request(server).get("/invitations/slug/test");
  expect(response.status).toBe(200);
  expect(response.body.userId.weddingSite).toEqual({ faq: { enabled: true, items: [item] } });
});
test("defensive public projection rejects malformed legacy content and unrelated private fields", () => {
  expect(publicWeddingSite({ faq: { enabled: "true", items: [item] } })).toBeUndefined();
  expect(publicWeddingSite({ private: "secret", faq: { enabled: true, items: [null, item] } })).toEqual({ faq: { enabled: true, items: [item] } });
});
