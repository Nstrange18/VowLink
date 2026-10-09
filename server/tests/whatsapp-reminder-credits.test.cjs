jest.mock("../models/User", () => ({ findById: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn() }));
const User = require("../models/User");
const { reserveWhatsAppSendCredit, refundWhatsAppSendCredit, addWhatsAppExtraSends } = require("../utils/whatsappCredits");

beforeEach(() => jest.clearAllMocks());
test("reminder credit reservation uses a single bounded Pro-only atomic increment", async () => {
  User.findOneAndUpdate.mockResolvedValue({ whatsappCloudIncludedSends: 100, whatsappCloudExtraSends: 0, whatsappCloudSendsUsed: 100 });
  const result = await reserveWhatsAppSendCredit("synthetic-user", { atomic: true });
  expect(result.reserved).toBe(true); expect(result.usage.remaining).toBe(0);
  expect(User.findById).not.toHaveBeenCalled();
  expect(User.findOneAndUpdate).toHaveBeenCalledTimes(1);
  expect(User.findOneAndUpdate).toHaveBeenCalledWith({
    _id: "synthetic-user", tier: "pro", $expr: { $lt: [
      { $ifNull: ["$whatsappCloudSendsUsed", 0] },
      { $add: [{ $ifNull: ["$whatsappCloudIncludedSends", 100] }, { $ifNull: ["$whatsappCloudExtraSends", 0] }] },
    ] },
  }, { $inc: { whatsappCloudSendsUsed: 1 } }, { new: true });
});
test("unmatched credit limit/Pro predicate prevents reservation", async () => {
  User.findOneAndUpdate.mockResolvedValue(null);
  User.findById.mockReturnValue({ select: async () => ({ whatsappCloudIncludedSends: 100, whatsappCloudSendsUsed: 100 }) });
  expect((await reserveWhatsAppSendCredit("synthetic-user", { atomic: true })).reserved).toBe(false);
});
test("existing invitation callers also use atomic reservation by default", async () => {
  User.findOneAndUpdate.mockResolvedValue({ whatsappCloudIncludedSends: 100, whatsappCloudSendsUsed: 1 });
  expect((await reserveWhatsAppSendCredit("synthetic-user")).reserved).toBe(true);
  expect(User.findOneAndUpdate).toHaveBeenCalledTimes(1);
});
test("adding credits never overwrites the used balance", async () => {
  User.findByIdAndUpdate.mockResolvedValue({ whatsappCloudExtraSends: 100, whatsappCloudSendsUsed: 10 });
  await addWhatsAppExtraSends("synthetic-user", 100);
  expect(User.findByIdAndUpdate).toHaveBeenCalledWith("synthetic-user", { $inc: { whatsappCloudExtraSends: 100 } }, { new: true });
});
test("refund atomically decrements only a positive usage balance", async () => {
  User.findOneAndUpdate.mockResolvedValue({ whatsappCloudIncludedSends: 100, whatsappCloudSendsUsed: 99 });
  expect((await refundWhatsAppSendCredit("synthetic-user", { atomic: true })).remaining).toBe(1);
  expect(User.findById).not.toHaveBeenCalled();
  expect(User.findOneAndUpdate).toHaveBeenCalledWith({ _id: "synthetic-user", whatsappCloudSendsUsed: { $gt: 0 } }, { $inc: { whatsappCloudSendsUsed: -1 } }, { new: true });
});
