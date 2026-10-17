jest.mock("../services/transactionalEmail", () => ({ sendTransactionalEmail: jest.fn() }));
jest.mock("../models/User", () => ({ find: jest.fn() }));
const { sendTransactionalEmail } = require("../services/transactionalEmail");
const helpers = require("../utils/email");
const User = require("../models/User");
const { checkWeddingDaysToday } = require("../services/weddingDayEmails");
const cases = [
  ["sendRsvpCoupleAlert", { coupleEmail: "couple@example.test", coupleName: "A & B", guestName: "Guest", attending: "Yes", guestCount: 2 }, "Guest just RSVPed to your wedding!", "Total party size"],
  ["sendRsvpGuestConfirmation", { guestEmail: "guest@example.test", guestName: "Guest", coupleName: "A & B", attending: "No", venue: "Test Venue" }, "RSVP Confirmed — A & B's Wedding", "won't be able to attend"],
  ["sendHoneymoonGoalReachedNotification", { coupleEmail: "couple@example.test", coupleName: "A & B", targetAmount: 100, currentAmount: 110 }, "VowLink Alert: Your Honeymoon Fund Target has been reached!", "110 / 100"],
  ["sendWeddingDayCongratulationsEmail", { coupleEmail: "couple@example.test", coupleName: "A & B" }, "Happy Wedding Day, A & B! ", "Happy Wedding Day!"],
  ["sendNewVenueRegistrationAdminAlert", { name: "Test Venue", ownerEmail: "venue@example.test" }, "VowLink Alerts: New Venue Account Created — Test Venue", "Test Venue"],
  ["sendRsvpLimitReachedAlert", { coupleEmail: "couple@example.test", coupleName: "A & B", tier: "free", limit: 20 }, "VowLink Alert: Your RSVP limit has been reached! (FREE Plan)", "20 / 20"],
];
beforeEach(() => { sendTransactionalEmail.mockReset().mockResolvedValue({ accepted: true, messageId: "id" }); });
test.each(cases)("%s preserves subject/content and returns acceptance", async (name, input, subject, content) => {
  const prior = process.env.EMAIL_ADMIN_ADDRESS; process.env.EMAIL_ADMIN_ADDRESS = "admin@example.test";
  try {
    expect(await helpers[name](input)).toMatchObject({ accepted: true });
    expect(sendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({ to: input.coupleEmail || input.guestEmail || "admin@example.test", subject, html: expect.stringContaining(content) }));
  } finally { if (prior === undefined) delete process.env.EMAIL_ADMIN_ADDRESS; else process.env.EMAIL_ADMIN_ADDRESS = prior; }
});
test.each(cases)("%s failure remains nonfatal and does not claim acceptance", async (name, input) => {
  sendTransactionalEmail.mockRejectedValue(new Error("synthetic failure"));
  expect(await helpers[name](input)).toEqual({ accepted: false });
});
test.each(["accepted", "failed", "unconfigured"])("wedding-day flag: %s", async outcome => {
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  const user = { weddingDate: new Date(), email: "couple@example.test", partner1Name: "A", partner2Name: "B", weddingEmailSent: false, save: jest.fn().mockResolvedValue() };
  User.find.mockResolvedValue([user]);
  if (outcome !== "accepted") sendTransactionalEmail.mockRejectedValue(new Error(outcome));
  try {
    await checkWeddingDaysToday();
    expect(user.weddingEmailSent).toBe(outcome === "accepted");
    expect(user.save).toHaveBeenCalledTimes(outcome === "accepted" ? 1 : 0);
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  } finally { log.mockRestore(); }
});
test("wedding-day flag waits for provider acceptance", async () => {
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  const user = { weddingDate: new Date(), email: "couple@example.test", save: jest.fn().mockResolvedValue() };
  let accept; sendTransactionalEmail.mockImplementation(() => new Promise(resolve => { accept = resolve; })); User.find.mockResolvedValue([user]);
  try { const pending = checkWeddingDaysToday(); await Promise.resolve(); expect(user.save).not.toHaveBeenCalled(); accept({ accepted: true }); await pending; expect(user.save).toHaveBeenCalledTimes(1); }
  finally { log.mockRestore(); }
});
