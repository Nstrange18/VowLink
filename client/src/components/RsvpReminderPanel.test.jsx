import { beforeEach, expect, test, vi } from "vitest";
import { act, render, screen, within, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import userEvent from "@testing-library/user-event";
import api from "../utils/api";
import RsvpReminderPanel from "./RsvpReminderPanel";

vi.mock("../utils/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
const guests = [
  { _id: "pending-guest", guestName: "Pending Guest", phoneNumber: "2348000000001", hasRSVPed: false },
  { _id: "yes-guest", guestName: "Yes Guest", phoneNumber: "2348000000002", hasRSVPed: true },
  { _id: "no-guest", guestName: "No Guest", phoneNumber: "2348000000003", hasRSVPed: true },
];
const owner = { tier: "pro", rsvpDeadline: "2030-06-01" };
beforeEach(() => {
  api.get.mockReset().mockResolvedValue({ data: { history: [] } });
  api.post.mockReset().mockResolvedValue({ data: { data: { id: "reminder-1", invitationId: "pending-guest", sendStatus: "accepted", deliveryStatus: "queued", retryAfter: "2030-01-02T12:00:00Z" } } });
});
const open = async (user = owner) => {
  render(<RsvpReminderPanel invitations={guests} user={user} />);
  const actor = userEvent.setup();
  await actor.click(screen.getByRole("button", { name: "RSVP reminders" }));
  await waitFor(() => expect(screen.queryByText("Loading reminder history…")).toBeNull());
  return actor;
};
test.each(["free", "plus", "unpaid"])("hides automated reminders for %s", (tier) => {
  render(<RsvpReminderPanel invitations={guests} user={{ tier }} />);
  expect(screen.queryByRole("button", { name: "RSVP reminders" })).toBeNull();
  expect(api.get).not.toHaveBeenCalled();
});
test("shows pending guests only, hiding both Yes and No respondents", async () => {
  await open(); expect(screen.getByText("Pending Guest")).not.toBeNull();
  expect(screen.queryByText("Yes Guest")).toBeNull(); expect(screen.queryByText("No Guest")).toBeNull();
});
test("single reminder sends a request key and blocks duplicate accepted submissions", async () => {
  const actor = await open(); await actor.click(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }));
  expect(api.post).toHaveBeenCalledWith("/whatsapp/reminders/send/pending-guest", {}, { headers: { "Idempotency-Key": expect.any(String) } });
  expect(toast.success).toHaveBeenCalledWith("1 RSVP reminder submitted.");
  await waitFor(() => expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(true));
  expect(screen.getByText("Reminder: queued")).not.toBeNull();
});

test("shows pending guests in groups of ten without losing selection", async () => {
  const list = Array.from({ length: 21 }, (_, index) => ({ _id: `guest-${index}`, guestName: `Guest ${index}`, phoneNumber: "2348000000001", hasRSVPed: false }));
  render(<RsvpReminderPanel invitations={list} user={owner} />);
  const actor = userEvent.setup();
  await actor.click(screen.getByRole("button", { name: "RSVP reminders" }));
  await waitFor(() => expect(screen.queryByText("Loading reminder history…")).toBeNull());
  expect(screen.queryByText("Guest 10")).toBeNull();
  await actor.click(screen.getByRole("checkbox", { name: "Select Guest 0 for RSVP reminder" }));
  await actor.click(screen.getByRole("button", { name: "Show 10 more guests" }));
  expect(screen.getByText("Guest 19")).not.toBeNull();
  expect(screen.queryByText("Guest 20")).toBeNull();
  await actor.click(screen.getByRole("button", { name: "Show fewer guests" }));
  expect(screen.queryByText("Guest 10")).toBeNull();
  expect(screen.getByRole("checkbox", { name: "Select Guest 0 for RSVP reminder" }).checked).toBe(true);
});

test("refreshes queued reminders to delivered without resending and stops on collapse", async () => {
  const interval = vi.spyOn(globalThis, "setInterval").mockReturnValue(123);
  const clear = vi.spyOn(globalThis, "clearInterval");
  try {
    const actor = await open();
    const poll = interval.mock.calls.find((call) => call[1] === 10000)[0];
    api.get.mockResolvedValue({ data: { history: [{ id: "reminder-1", invitationId: "pending-guest", sendStatus: "accepted", deliveryStatus: "delivered", retryAfter: "2030-01-02" }] } });
    await act(async () => { await poll(); });
    expect(screen.getByText("Reminder: delivered")).not.toBeNull();
    expect(api.post).not.toHaveBeenCalled();
    await actor.click(screen.getByRole("button", { name: "RSVP reminders" }));
    expect(clear).toHaveBeenCalledWith(123);
  } finally { interval.mockRestore(); clear.mockRestore(); }
});
test("bulk sends selected pending guests only", async () => {
  api.post.mockResolvedValue({ data: { results: [{ id: "pending-guest", data: { id: "reminder-1", invitationId: "pending-guest", sendStatus: "accepted", deliveryStatus: "queued", retryAfter: "2030-01-02" } }] } });
  const actor = await open(); await actor.click(screen.getByRole("checkbox", { name: "Select Pending Guest for RSVP reminder" }));
  await actor.click(screen.getByRole("button", { name: "Send RSVP Reminder to selected pending guests" }));
  expect(api.post).toHaveBeenCalledWith("/whatsapp/reminders/send-bulk", { invitationIds: ["pending-guest"] }, { headers: { "Idempotency-Key": expect.any(String) } });
});
test("ambiguous network retry retains the same idempotency key", async () => {
  api.post.mockRejectedValue(new Error("network unavailable"));
  const actor = await open(); const button = screen.getByRole("button", { name: "Send RSVP Reminder", exact: true });
  await actor.click(button); await actor.click(button);
  expect(api.post).toHaveBeenCalledTimes(2);
  expect(api.post.mock.calls[0][2]).toEqual(api.post.mock.calls[1][2]);
});
test.each(["unknown", "sending", "preparing"])("blocks %s reminders loaded from history", async (sendStatus) => {
  api.get.mockResolvedValue({ data: { history: [{ id: "reminder-1", invitationId: "pending-guest", sendStatus, deliveryStatus: "not_sent" }] } });
  await open(); expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(true);
});
test("requires a future deadline", async () => {
  await open({ tier: "pro" }); expect(screen.getByText("Set a future RSVP deadline in Settings before sending reminders.")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(true);
  expect(screen.getByRole("link", { name: "Set RSVP deadline" }).getAttribute("href")).toBe("/admin/settings");
  expect(screen.getByRole("checkbox", { name: "Select Pending Guest for RSVP reminder" }).disabled).toBe(true);
});

test("makes expansion clear and supports collapsing the guest list", async () => {
  render(<RsvpReminderPanel invitations={guests} user={owner} />);
  const actor = userEvent.setup();
  const toggle = screen.getByRole("button", { name: "RSVP reminders" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(screen.getByText("Show guests")).not.toBeNull();
  await actor.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("Hide guests")).not.toBeNull();
  await actor.click(toggle);
  expect(screen.queryByText("Pending Guest")).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});

test("select all includes only eligible pending guests and explains missing phones", async () => {
  render(<RsvpReminderPanel invitations={[...guests, { _id: "no-phone", guestName: "Missing Phone", hasRSVPed: false }]} user={owner} />);
  const actor = userEvent.setup();
  await actor.click(screen.getByRole("button", { name: "RSVP reminders" }));
  await waitFor(() => expect(screen.queryByText("Loading reminder history…")).toBeNull());
  expect(screen.getByText("Add a phone number to send a reminder.")).not.toBeNull();
  await actor.click(screen.getByRole("checkbox", { name: "Select all eligible pending guests" }));
  expect(screen.getByRole("checkbox", { name: "Select Pending Guest for RSVP reminder" }).checked).toBe(true);
  expect(screen.getByRole("checkbox", { name: "Select Missing Phone for RSVP reminder" }).checked).toBe(false);
  expect(screen.getByText("Send reminders (1 selected)")).not.toBeNull();
  expect(api.post).not.toHaveBeenCalled();
});
test("history failure disables sending until a successful refresh", async () => {
  api.get.mockRejectedValueOnce(new Error("history unavailable")); const actor = await open();
  expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(true);
  await actor.click(screen.getByRole("button", { name: "Refresh reminder history" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(false));
});
test("displays recipient marketing limit independently from invitation delivery", async () => {
  api.get.mockResolvedValue({ data: { history: [{ id: "reminder-1", invitationId: "pending-guest", sendStatus: "accepted", deliveryStatus: "marketing_limited", retryAfter: "2030-01-02" }] } });
  await open(); const row = within(screen.getByText("Pending Guest").closest("li"));
  expect(row.getByText(/WhatsApp temporarily limited marketing delivery/)).not.toBeNull();
  expect(row.getByRole("button").disabled).toBe(true);
});
