import { beforeEach, expect, test, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
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
  await waitFor(() => expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(true));
  expect(screen.getByText("Reminder: queued")).not.toBeNull();
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
  await open({ tier: "pro" }); expect(screen.getByText(/Set a future RSVP deadline/)).not.toBeNull();
  expect(screen.getByRole("button", { name: "Send RSVP Reminder", exact: true }).disabled).toBe(true);
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
