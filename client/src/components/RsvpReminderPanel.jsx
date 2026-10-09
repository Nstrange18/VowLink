import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import { failureMessages } from "../utils/whatsappDelivery";
import { Icon } from "@iconify/react";

const isBlocked = (record) =>
  record &&
  (["preparing", "sending", "unknown"].includes(record.sendStatus) ||
    (record.sendStatus === "accepted" &&
      (!record.retryAfter || new Date(record.retryAfter) > new Date())));

export default function RsvpReminderPanel({ invitations, user, onChanged }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [visibleGuests, setVisibleGuests] = useState(10);
  const keys = useRef(new Map());
  const sending = useRef(false);
  const isPro = user?.tier === "pro";

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await api.get("/whatsapp/reminders/history");
      setHistory(response.data.history || []);
      setHistoryError("");
    } catch {
      setHistoryError(
        "Could not load reminder history. Refresh before sending.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!open || !isPro) return;
    let cancelled = false;
    setLoading(true);
    api
      .get("/whatsapp/reminders/history")
      .then(({ data }) => {
        if (!cancelled) {
          setHistory(data.history || []);
          setHistoryError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setHistoryError(
            "Could not load reminder history. Refresh before sending.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isPro]);

  useEffect(() => {
    if (!open || !isPro) return;
    let cancelled = false;
    let running = false;
    const timer = setInterval(async () => {
      if (running || sending.current || document.hidden) return;
      running = true;
      try {
        const response = await api.get("/whatsapp/reminders/history");
        if (!cancelled) {
          setHistory(response.data.history || []);
          setHistoryError("");
        }
      } catch {
        /* Keep the last known delivery state; manual refresh reports errors. */
      } finally {
        running = false;
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, isPro]);

  if (!isPro) return null;
  const pending = invitations.filter((guest) => !guest.hasRSVPed);
  const latest = (id) =>
    history.find((record) => String(record.invitationId) === String(id));
  const deadlineValid =
    user.rsvpDeadline && new Date(user.rsvpDeadline) > new Date();
  const canSend = (guest) =>
    deadlineValid && guest.phoneNumber && !isBlocked(latest(guest._id));
  const disabled = busy || loading || Boolean(historyError);
  const eligibleGuests = pending.filter(canSend);
  const selectedCount = selected.filter((id) =>
    eligibleGuests.some((guest) => guest._id === id),
  ).length;
  const blockReason = (guest) => {
    if (!deadlineValid)
      return "Set a future RSVP deadline to enable reminders.";
    if (!guest.phoneNumber) return "Add a phone number to send a reminder.";
    const record = latest(guest._id);
    if (record?.sendStatus === "unknown")
      return "Submission is uncertain. Contact support before retrying.";
    if (["preparing", "sending"].includes(record?.sendStatus))
      return "A reminder is already being processed.";
    if (isBlocked(record))
      return "A reminder was sent recently. Wait for the 24-hour cooldown.";
    return "Awaiting RSVP · Ready for a reminder";
  };

  const send = async (ids, bulk = false) => {
    if (sending.current) return;
    const eligible = ids.filter((id) =>
      pending.some((guest) => guest._id === id && canSend(guest)),
    );
    if (!eligible.length) return;
    if (eligible.length > 100) {
      toast.warning("Select no more than 100 guests per reminder send.");
      return;
    }
    // Retain the same key after a network/ambiguous error. A retry cannot duplicate a send.
    const action = [...eligible].sort().join(",");
    if (!keys.current.has(action))
      keys.current.set(action, crypto.randomUUID());
    sending.current = true;
    setBusy(true);
    try {
      const response = await api.post(
        bulk
          ? "/whatsapp/reminders/send-bulk"
          : `/whatsapp/reminders/send/${eligible[0]}`,
        bulk ? { invitationIds: eligible } : {},
        { headers: { "Idempotency-Key": keys.current.get(action) } },
      );
      const results = bulk
        ? response.data.results
        : [{ id: eligible[0], data: response.data.data }];
      const records = results.map((result) => result.data).filter(Boolean);
      setHistory((previous) => [
        ...records,
        ...previous.filter(
          (item) => !records.some((record) => record.id === item.id),
        ),
      ]);
      const accepted = records.filter(
        (record) => record.sendStatus === "accepted",
      ).length;
      const uncertain = records.some((record) =>
        ["unknown", "preparing", "sending"].includes(record.sendStatus),
      );
      if (!uncertain) keys.current.delete(action);
      if (accepted)
        toast.success(
          `${accepted} RSVP reminder${accepted === 1 ? "" : "s"} submitted.`,
        );
      if (
        results.some(
          (result) => !result.data || result.data.sendStatus !== "accepted",
        )
      ) {
        toast.warning(
          uncertain
            ? "Submission status is unknown. Refresh history; do not retry."
            : "Some reminders were not submitted. Review reminder history and guest eligibility.",
        );
      }
      setSelected([]);
    } catch (error) {
      if (error.response?.status && error.response.status < 500)
        keys.current.delete(action);
      toast.error(
        error.response?.data?.message ||
          "Could not confirm submission. Refresh reminder history before trying again.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
      onChanged?.();
    }
  };

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0D1220]"
      aria-label="RSVP reminders"
    >
      <button
        type="button"
        aria-label="RSVP reminders"
        className="flex w-full items-center gap-4 p-5 text-left hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#D8B76A] cursor-pointer"
        aria-expanded={open}
        aria-controls="rsvp-reminder-guests"
        onClick={() => {
          setOpen(!open);
          setVisibleGuests(10);
        }}
      >
        <Icon
          icon="lucide:bell-ring"
          className="h-6 w-6 shrink-0 text-[#D8B76A]"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-2xl text-[#D8B76A]">
            RSVP reminders
          </span>
          <span className="mt-1 block text-sm text-white/60">
            {pending.length} guests awaiting a response ·{" "}
            {deadlineValid ? "Deadline set" : "RSVP deadline needed"}
          </span>
        </span>
        <span className="hidden text-sm text-[#D8B76A] sm:block">
          {open ? "Hide guests" : "Show guests"}
        </span>
        <Icon
          icon={open ? "lucide:chevron-up" : "lucide:chevron-down"}
          className="h-5 w-5 shrink-0 text-[#D8B76A]"
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id="rsvp-reminder-guests"
          className="space-y-4 border-t border-white/10 p-5"
        >
          <p className="text-xs text-white/60">
            Send the approved RSVP reminder to guests who have not responded.
            Each accepted submission uses one WhatsApp send. Reminders have a
            24-hour cooldown.
          </p>
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${deadlineValid ? "border-white/10 bg-white/5" : "border-amber-300/25 bg-amber-300/5"}`}
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">
                RSVP deadline
              </p>
              {deadlineValid ? (
                <p className="mt-1 text-sm font-semibold">
                  {new Date(user.rsvpDeadline).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              ) : (
                <p role="status" className="mt-1 text-sm text-amber-300">
                  Set a future RSVP deadline in Settings before sending
                  reminders.
                </p>
              )}
              <p className="mt-1 text-xs text-white/60">
                Template approval is complete. A future deadline is still
                required to send.
              </p>
            </div>
            <a
              href="/admin/settings?tab=general"
              className="rounded-lg border border-[#D8B76A]/40 px-4 py-2 text-sm text-[#D8B76A] hover:bg-[#D8B76A]/10 focus-visible:outline-2 focus-visible:outline-[#D8B76A]"
            >
              {deadlineValid ? "Edit deadline" : "Set RSVP deadline"}
            </a>
          </div>
          {historyError && (
            <p role="alert" className="text-sm text-red-300">
              {historyError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              aria-label="Send RSVP Reminder to selected pending guests"
              disabled={disabled || !selectedCount}
              onClick={() => send(selected, true)}
              className="rounded-lg bg-[#D8B76A] px-4 py-2 text-sm font-semibold text-[#070A13] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy
                ? "Submitting reminders…"
                : `Send reminders (${selectedCount} selected)`}
            </button>
            <button
              type="button"
              disabled={busy || loading}
              onClick={refresh}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-40 cursor-pointer"
            >
              Refresh reminder history
            </button>
          </div>
          {loading && (
            <div role="status" className="rounded-lg bg-white/5 p-4 text-sm">
              <span>Loading reminder history…</span>
              <div
                aria-hidden="true"
                className="mt-3 h-8 animate-pulse motion-reduce:animate-none rounded bg-white/5"
              />
            </div>
          )}
          {!pending.length && (
            <p className="text-sm text-white/60">
              No guests are awaiting an RSVP.
            </p>
          )}
          {!!pending.length && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  aria-label="Select all eligible pending guests"
                  disabled={disabled || !eligibleGuests.length}
                  checked={
                    eligibleGuests.length > 0 &&
                    selectedCount === eligibleGuests.length
                  }
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? eligibleGuests.map((guest) => guest._id)
                        : [],
                    )
                  }
                  className="h-4 w-4 accent-[#D8B76A]"
                />
                Select eligible guests
              </label>
              <span className="text-white/60">
                {eligibleGuests.length} eligible · {selectedCount} selected
              </span>
            </div>
          )}
          <p className="text-xs text-white/60">
            Delivery updates refresh every 10 seconds while this panel is open.
            Queued means Meta accepted the request; delivery is not yet
            confirmed.
          </p>
          <ul className="space-y-2">
            {pending.slice(0, visibleGuests).map((guest) => {
              const record = latest(guest._id);
              return (
                <li
                  key={guest._id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${guest.guestName} for RSVP reminder`}
                    checked={selected.includes(guest._id)}
                    disabled={disabled || !canSend(guest)}
                    onChange={(event) =>
                      setSelected((previous) =>
                        event.target.checked
                          ? [...previous, guest._id]
                          : previous.filter((id) => id !== guest._id),
                      )
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold">
                      {guest.guestName}
                    </span>
                    <p
                      className={`mt-1 text-xs ${canSend(guest) ? "text-white/60" : "text-amber-300"}`}
                    >
                      {blockReason(guest)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={disabled || !canSend(guest)}
                    onClick={() => send([guest._id])}
                    className="col-span-2 rounded-lg border border-[#D8B76A]/40 px-3 py-2 text-xs text-[#D8B76A] disabled:opacity-40 cursor-pointer sm:col-span-1"
                  >
                    Send RSVP Reminder
                  </button>
                  {record && (
                    <div className="col-span-2 flex flex-wrap items-center gap-2 text-xs sm:col-span-3">
                      <span
                        className={`rounded-full border px-3 py-1 font-semibold ${["delivered", "read"].includes(record.deliveryStatus) ? "border-emerald-400/30 text-emerald-300" : "border-[#D8B76A]/30 text-[#D8B76A]"}`}
                      >{`Reminder: ${record.deliveryStatus === "not_sent" ? record.sendStatus : record.deliveryStatus}`}</span>
                      {(failureMessages[record.deliveryStatus] ||
                        record.failureReason) && (
                        <p className="min-w-0 break-words text-white/60">
                          {failureMessages[record.deliveryStatus] ||
                            record.failureReason}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {pending.length > 10 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="text-xs text-white/60">
                Showing {Math.min(visibleGuests, pending.length)} of{" "}
                {pending.length} guests
              </span>
              <div className="flex flex-wrap gap-3">
                {visibleGuests < pending.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleGuests((count) => count + 10)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm"
                  >
                    Show 10 more guests
                  </button>
                )}
                {visibleGuests > 10 && (
                  <button
                    type="button"
                    onClick={() => setVisibleGuests(10)}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm"
                  >
                    Show fewer guests
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
