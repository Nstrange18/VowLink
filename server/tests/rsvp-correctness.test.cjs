const http = require("node:http");
const express = require("express");
const request = require("supertest");
const { allowTestServer } = require("./setup.cjs");
jest.mock("express-rate-limit", () => () => (_req, _res, next) => next());
jest.mock("../middleware/auth", () => ({ protect: (req, _res, next) => { req.user = { id: "owner" }; next(); } }));
jest.mock("../models/Invitation", () => ({ findById: jest.fn(), find: jest.fn(), updateOne: jest.fn() }));
jest.mock("../models/User", () => ({ findById: jest.fn() }));
jest.mock("../models/RSVP", () => ({ findOne: jest.fn(), findOneAndUpdate: jest.fn(), find: jest.fn(), distinct: jest.fn(), init: jest.fn() }));
jest.mock("../utils/email", () => ({ sendRsvpCoupleAlert: jest.fn(), sendRsvpGuestConfirmation: jest.fn(), sendRsvpLimitReachedAlert: jest.fn() }));
const Invitation = require("../models/Invitation");
const RSVP = require("../models/RSVP");
const User = require("../models/User");
const mongoose = require("mongoose");
const email = require("../utils/email");
const router = require("../routes/rsvpRoutes");
const { currentRsvps, checkInRsvpIssue } = require("../utils/rsvpState");
const { reconcileRsvpFlag } = require("../services/rsvpPersistence");
const id = "507f1f77bcf86cd799439011";
let server, invitation, records, clock, transaction;
const session = { synthetic: true };
beforeAll(async () => {
  const app = express(); app.use(express.json()); app.use("/rsvps", router);
  app.use("/invitations", require("../routes/invitationRoutes"));
  server = http.createServer(app); allowTestServer(server);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
});
afterAll(async () => { await new Promise((resolve) => server.close(resolve)); });
beforeEach(() => {
  jest.clearAllMocks(); records = [];
  clock = jest.spyOn(Date, "now").mockReturnValue(Date.parse("2030-06-01T00:00:00Z"));
  invitation = { _id: id, allowedGuests: 4, hasRSVPed: false, save: jest.fn().mockResolvedValue(),
    userId: { _id: "owner", tier: "pro", rsvpDeadline: "2030-06-02T00:00:00Z", plusOnePolicy: "invitation_only" } };
  Invitation.findById.mockImplementation(() => ({ populate: async () => invitation, session: async () => invitation }));
  User.findById.mockImplementation(() => ({ select: () => ({ session: async () => invitation?.userId }) }));
  Invitation.updateOne.mockReset().mockImplementation(async (_filter, update) => { Object.assign(invitation, update.$set); return { matchedCount: 1, modifiedCount: 1 }; });
  transaction = jest.spyOn(mongoose.connection, "transaction").mockImplementation(async (work) => {
    const oldRecords = structuredClone(records); const oldFlag = invitation?.hasRSVPed;
    try { return await work(session); }
    catch (error) { records.splice(0, records.length, ...oldRecords); if (invitation) invitation.hasRSVPed = oldFlag; throw error; }
  });
  Invitation.find.mockReturnValue({ select: async () => [{ _id: id }] });
  RSVP.findOne.mockImplementation(() => ({ sort: () => {
    const value = records.find((r) => r.currentKey) || records[records.length - 1] || null;
    return Object.assign(Promise.resolve(value), { session: async () => value });
  } }));
  RSVP.distinct.mockImplementation(async () => records.length ? [id] : []);
  RSVP.init.mockResolvedValue();
  RSVP.findOneAndUpdate.mockImplementation(async (filter, update, options) => {
    let record = records.find((r) => filter._id ? r._id === filter._id : r.currentKey === filter.currentKey);
    if (!record && options?.upsert) { record = { _id: `response-${records.length}` }; records.push(record); }
    if (record) Object.assign(record, update.$set);
    return record;
  });
  RSVP.find.mockImplementation(() => ({ populate: () => ({ sort: async () => records }) }));
  for (const fn of Object.values(email)) fn.mockResolvedValue();
});
afterEach(() => { clock.mockRestore(); transaction.mockRestore(); });
const submit = (body = {}) => request(server).post("/rsvps").send({ invitationId: id, guestName: "Synthetic Guest", phone: "2348000000001", attending: "Yes", mealPreference: "Fish", message: "Synthetic wish", ...body });
test("before deadline stores actual confirmed count, meal and message", async () => {
  expect((await submit({ numberOfGuests: 2 })).status).toBe(201);
  expect(records[0]).toMatchObject({ numberOfGuests: 2, mealPreference: "Fish", message: "Synthetic wish" });
  expect(invitation.hasRSVPed).toBe(true);
});
test("old clients default to one confirmed person, not the maximum allowance", async () => { await submit(); expect(records[0].numberOfGuests).toBe(1); });
test("duplicate submission updates one response", async () => { await submit(); await submit(); expect(records).toHaveLength(1); });
test("transaction commits both writes before email delivery", async () => {
  transaction.mockImplementationOnce(async (work) => {
    const result = await work(session);
    expect(records).toHaveLength(1); expect(invitation.hasRSVPed).toBe(true);
    expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
    expect(email.sendRsvpGuestConfirmation).not.toHaveBeenCalled();
    return result;
  });
  expect((await submit({ guestEmail: "synthetic@example.test" })).status).toBe(201);
  expect(email.sendRsvpCoupleAlert).toHaveBeenCalledTimes(1);
  expect(email.sendRsvpGuestConfirmation).toHaveBeenCalledTimes(1);
  expect(RSVP.findOneAndUpdate.mock.calls[0][2].session).toBe(session);
  expect(Invitation.updateOne.mock.calls[0][2].session).toBe(session);
});
test("transaction callback retries cannot send emails before the final commit", async () => {
  transaction.mockImplementationOnce(async (work) => {
    await work(session); records.length = 0; invitation.hasRSVPed = false;
    expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
    return work(session);
  });
  expect((await submit()).status).toBe(201);
  expect(email.sendRsvpCoupleAlert).toHaveBeenCalledTimes(1); expect(records).toHaveLength(1);
});
test.each([false, true])("admin invitation reads derive response flag without repairing data (stored=%s)", async (storedFlag) => {
  invitation.hasRSVPed = storedFlag;
  const doc = { ...invitation, checkInToken: "synthetic-existing-token", toObject: () => ({ _id: id, hasRSVPed: storedFlag, phoneNumber: "", senderGroup: "general" }) };
  Invitation.find.mockReturnValue({ sort: async () => [doc] });
  RSVP.distinct.mockResolvedValue(storedFlag ? [] : [id]);
  const response = await request(server).get("/invitations");
  expect(response.status).toBe(200); expect(response.body[0].hasRSVPed).toBe(!storedFlag);
  expect(invitation.hasRSVPed).toBe(storedFlag); expect(Invitation.updateOne).not.toHaveBeenCalled();
});
test("flag write failure leaves no RSVP and sends no email", async () => {
  Invitation.updateOne.mockRejectedValueOnce(new Error("flag failure"));
  expect((await submit()).status).toBe(500); expect(records).toHaveLength(0);
  expect(invitation.hasRSVPed).toBe(false); expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
});
test("RSVP failure rolls back the flag", async () => {
  RSVP.findOneAndUpdate.mockRejectedValueOnce(new Error("RSVP failure"));
  expect((await submit()).status).toBe(500); expect(records).toHaveLength(0);
  expect(invitation.hasRSVPed).toBe(false); expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
});
test("commit rejection never sends confirmation emails", async () => {
  transaction.mockImplementationOnce(async (work) => {
    await work(session); records.length = 0; invitation.hasRSVPed = false;
    throw new Error("commit rejected");
  });
  expect((await submit()).status).toBe(500); expect(records).toHaveLength(0);
  expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
});
test.each([false, true])("local standalone fallback restores the previous flag on write failure (%s)", async (previousFlag) => {
  const oldEnv = process.env.NODE_ENV, oldHost = mongoose.connection.host, oldDb = mongoose.connection.db;
  process.env.NODE_ENV = "development"; mongoose.connection.host = "127.0.0.1";
  mongoose.connection.db = { admin: () => ({ command: async () => ({}) }) };
  invitation.hasRSVPed = previousFlag;
  RSVP.findOneAndUpdate.mockRejectedValueOnce(new Error("local write failed"));
  try {
    expect((await submit()).status).toBe(500); expect(invitation.hasRSVPed).toBe(previousFlag);
    expect(records).toHaveLength(0); expect(transaction).not.toHaveBeenCalled();
    expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
  } finally { process.env.NODE_ENV = oldEnv; mongoose.connection.host = oldHost; mongoose.connection.db = oldDb; }
});
test("duplicate-key retry starts a fresh transaction while deadline is open", async () => {
  RSVP.findOneAndUpdate.mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: 11000 }));
  expect((await submit()).status).toBe(201); expect(transaction).toHaveBeenCalledTimes(2);
  expect(email.sendRsvpCoupleAlert).toHaveBeenCalledTimes(1);
});
test("duplicate-key retry after cutoff cannot write or send email", async () => {
  RSVP.findOneAndUpdate.mockImplementationOnce(async () => {
    clock.mockReturnValue(Date.parse("2030-06-03"));
    throw Object.assign(new Error("duplicate"), { code: 11000 });
  });
  const response = await submit(); expect(response.status).toBe(403);
  expect(response.body.message).toBe("RSVP is now closed. Please contact the couple.");
  expect(RSVP.findOneAndUpdate).toHaveBeenCalledTimes(1);
  expect(invitation.hasRSVPed).toBe(false); expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
});
test("retry reloads a deadline changed by the couple", async () => {
  RSVP.findOneAndUpdate.mockImplementationOnce(async () => {
    invitation.userId.rsvpDeadline = "2030-05-01";
    throw Object.assign(new Error("duplicate"), { code: 11000 });
  });
  expect((await submit()).status).toBe(403); expect(RSVP.findOneAndUpdate).toHaveBeenCalledTimes(1);
});
test("check-in uses current RSVP despite stale false flag", async () => {
  records.push({ invitationId: id, attending: "Yes" });
  expect(invitation.hasRSVPed).toBe(false); expect(await checkInRsvpIssue(id)).toBe("");
});
test("stale true flag without a response does not permit check-in", async () => {
  invitation.hasRSVPed = true; expect(await checkInRsvpIssue(id)).toMatch(/has not submitted/);
});
test("current No answer blocks check-in even with an old Yes response", async () => {
  records.push({ invitationId: id, attending: "Yes" }, { invitationId: id, currentKey: id, attending: "No" });
  expect(await checkInRsvpIssue(id)).toMatch(/not attending/);
});
test.each([false, true])("flag repair is idempotent and independent of deadlines (response=%s)", async (responded) => {
  invitation.hasRSVPed = !responded; invitation.userId.rsvpDeadline = "2000-01-01";
  if (responded) records.push({ invitationId: id, attending: "No" });
  expect(await reconcileRsvpFlag(id)).toMatchObject({ repaired: true, hasRSVPed: responded });
  expect(await reconcileRsvpFlag(id)).toMatchObject({ repaired: false, hasRSVPed: responded });
  expect(Invitation.updateOne).toHaveBeenCalledTimes(1);
  expect(RSVP.findOneAndUpdate).not.toHaveBeenCalled(); expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
});
test("concurrent repeated submissions keep one current response", async () => { await Promise.all([submit(), submit()]); expect(records).toHaveLength(1); expect(records[0].headcountConfirmed).toBe(true); });
test("admin list hides superseded legacy duplicates without deleting them", async () => {
  records.push({ _id: "current", currentKey: id, invitationId: { _id: id }, attending: "No", numberOfGuests: 0 }, { _id: "old", invitationId: { _id: id }, attending: "Yes", numberOfGuests: 4 });
  const response = await request(server).get("/rsvps"); expect(response.status).toBe(200); expect(response.body).toHaveLength(1); expect(response.body[0].attending).toBe("No"); expect(records).toHaveLength(2);
});
test("partial unique index excludes unchanged legacy records", () => {
  const model = jest.requireActual("../models/RSVP");
  expect(model.schema.indexes()).toContainEqual([{ currentKey: 1 }, expect.objectContaining({ unique: true, partialFilterExpression: { currentKey: { $type: "string" } } })]);
  expect(new model({ invitationId: id, guestName: "Synthetic", phone: "2348000000001", attending: "Yes" }).currentKey).toBeUndefined();
});
test("Yes to No keeps hasRSVPed and sets count zero", async () => { await submit({ numberOfGuests: 3 }); await submit({ attending: "No", numberOfGuests: 3 }); expect(records[0]).toMatchObject({ attending: "No", numberOfGuests: 0 }); expect(invitation.hasRSVPed).toBe(true); });
test("No to Yes uses newly confirmed count", async () => { await submit({ attending: "No" }); await submit({ numberOfGuests: 2 }); expect(records).toHaveLength(1); expect(records[0]).toMatchObject({ attending: "Yes", numberOfGuests: 2 }); });
test.each([false, true])("closed deadline rejects new/update (existing=%s) without side effects", async (existing) => {
  if (existing) await submit();
  jest.clearAllMocks(); invitation.userId.rsvpDeadline = "2030-05-31T23:59:59Z";
  const response = await submit(); expect(response.status).toBe(403); expect(response.body.message).toMatch(/RSVP is now closed/);
  expect(RSVP.findOneAndUpdate).not.toHaveBeenCalled(); expect(invitation.save).not.toHaveBeenCalled(); expect(email.sendRsvpCoupleAlert).not.toHaveBeenCalled();
});
test.each([["2030-06-01T01:00:00+01:00", 201], ["2030-06-01T00:59:59+01:00", 403], ["2030-06-01", 201], ["2030-05-31", 403]])("timezone boundary %s returns %s", async (deadline, status) => { invitation.userId.rsvpDeadline = deadline; expect((await submit()).status).toBe(status); });
test("deadline expires while awaiting index before write", async () => { RSVP.init.mockImplementation(async () => clock.mockReturnValue(Date.parse("2030-06-03"))); expect((await submit()).status).toBe(403); expect(RSVP.findOneAndUpdate).not.toHaveBeenCalled(); });
test("missing deadline preserves open behavior", async () => { invitation.userId.rsvpDeadline = null; expect((await submit()).status).toBe(201); });
test("invalid deadline fails closed", async () => { invitation.userId.rsvpDeadline = "bad"; expect((await submit()).status).toBe(403); });
test.each([0, -1, 5, 1.5, "2", null])("invalid confirmed count %s is rejected or defaults safely", async (count) => { const response = await submit({ numberOfGuests: count }); expect(response.status).toBe(count === null ? 201 : 400); });
test("plus-one maximum is a ceiling, not confirmed count", async () => { invitation.userId.plusOnePolicy = "plus_one_allowed"; expect((await submit({ numberOfGuests: 5 })).status).toBe(201); expect((await submit({ numberOfGuests: 6 })).status).toBe(400); });
test("legacy duplicate records are retained; latest response is updated in place", async () => { records.push({ _id: "old", invitationId: id, attending: "Yes" }, { _id: "latest", invitationId: id, attending: "No" }); await submit(); expect(records).toHaveLength(2); expect(records[1].currentKey).toBe(id); expect(records[0].currentKey).toBeUndefined(); expect(currentRsvps([records[1], records[0]])).toEqual([records[1]]); });
test("edit at plan capacity remains possible", async () => { await submit(); invitation.userId.tier = "free"; RSVP.distinct.mockResolvedValue(Array(20).fill(id)); expect((await submit({ attending: "No" })).status).toBe(201); });
test("malformed invitation is a clear 400", async () => { expect((await submit({ invitationId: "bad" })).status).toBe(400); expect(Invitation.findById).not.toHaveBeenCalled(); });
test("missing invitation is 404", async () => { invitation = null; expect((await submit()).status).toBe(404); });
test("missing owner is 404", async () => { invitation.userId = null; expect((await submit()).status).toBe(404); });
test("inactive workspace rejects submission", async () => { invitation.userId.tier = "unpaid"; expect((await submit()).status).toBe(403); });
test("duplicate-key race updates winning canonical record", async () => { RSVP.findOneAndUpdate.mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: 11000 })); records.push({ _id: "winner", currentKey: id }); expect((await submit()).status).toBe(201); expect(records).toHaveLength(1); });
