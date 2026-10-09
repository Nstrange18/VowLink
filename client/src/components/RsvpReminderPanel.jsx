import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import { failureMessages } from "../utils/whatsappDelivery";

const isBlocked = (record) => record && (
  ["preparing", "sending", "unknown"].includes(record.sendStatus) ||
  (record.sendStatus === "accepted" && (!record.retryAfter || new Date(record.retryAfter) > new Date()))
);

export default function RsvpReminderPanel({ invitations, user, onChanged }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const keys = useRef(new Map());
  const sending = useRef(false);
  const isPro = user?.tier === "pro";

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await api.get("/whatsapp/reminders/history");
      setHistory(response.data.history || []);
      setHistoryError("");
    } catch { setHistoryError("Could not load reminder history. Refresh before sending."); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!open || !isPro) return;
    let cancelled = false;
    setLoading(true);
    api.get("/whatsapp/reminders/history").then(({ data }) => {
      if (!cancelled) { setHistory(data.history || []); setHistoryError(""); }
    }).catch(() => {
      if (!cancelled) setHistoryError("Could not load reminder history. Refresh before sending.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, isPro]);

  if (!isPro) return null;
  const pending = invitations.filter((guest) => !guest.hasRSVPed);
  const latest = (id) => history.find((record) => String(record.invitationId) === String(id));
  const deadlineValid = user.rsvpDeadline && new Date(user.rsvpDeadline) > new Date();
  const canSend = (guest) => deadlineValid && guest.phoneNumber && !isBlocked(latest(guest._id));
  const disabled = busy || loading || Boolean(historyError);

  const send = async (ids, bulk = false) => {
    if (sending.current) return;
    const eligible = ids.filter((id) => pending.some((guest) => guest._id === id && canSend(guest)));
    if (!eligible.length) return;
    if (eligible.length > 100) {
      toast.warning("Select no more than 100 guests per reminder send.");
      return;
    }
    // Retain the same key after a network/ambiguous error. A retry cannot duplicate a send.
    const action = [...eligible].sort().join(",");
    if (!keys.current.has(action)) keys.current.set(action, crypto.randomUUID());
    sending.current = true;
    setBusy(true);
    try {
      const response = await api.post(bulk ? "/whatsapp/reminders/send-bulk" : `/whatsapp/reminders/send/${eligible[0]}`,
        bulk ? { invitationIds: eligible } : {},
        { headers: { "Idempotency-Key": keys.current.get(action) } });
      const results = bulk ? response.data.results : [{ id: eligible[0], data: response.data.data }];
      const records = results.map((result) => result.data).filter(Boolean);
      setHistory((previous) => [...records, ...previous.filter((item) => !records.some((record) => record.id === item.id))]);
      const accepted = records.filter((record) => record.sendStatus === "accepted").length;
      const uncertain = records.some((record) => ["unknown", "preparing", "sending"].includes(record.sendStatus));
      if (!uncertain) keys.current.delete(action);
      if (accepted) toast.success(`${accepted} RSVP reminder${accepted === 1 ? "" : "s"} submitted.`);
      if (results.some((result) => !result.data || result.data.sendStatus !== "accepted")) {
        toast.warning(uncertain ? "Submission status is unknown. Refresh history; do not retry." : "Some reminders were not submitted. Review reminder history and guest eligibility.");
      }
      setSelected([]);
    } catch (error) {
      if (error.response?.status && error.response.status < 500) keys.current.delete(action);
      toast.error(error.response?.data?.message || "Could not confirm submission. Refresh reminder history before trying again.");
    } finally { sending.current = false; setBusy(false); onChanged?.(); }
  };

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-[#0D1220] p-5" aria-label="RSVP reminders">
      <button type="button" className="font-serif text-lg text-[#D8B76A] cursor-pointer" aria-expanded={open} onClick={() => setOpen(!open)}>RSVP reminders</button>
      {open && <div className="mt-4 space-y-4">
        <p className="text-xs text-white/60">Send the approved RSVP reminder to guests who have not responded. Each accepted submission uses one WhatsApp send. Reminders have a 24-hour cooldown.</p>
        {!deadlineValid && <p role="status" className="text-sm text-amber-300">Set a future RSVP deadline in Settings before sending reminders.</p>}
        {historyError && <p role="alert" className="text-sm text-red-300">{historyError}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={disabled || !selected.some((id) => pending.some((guest) => guest._id === id && canSend(guest)))} onClick={() => send(selected, true)} className="rounded-lg bg-[#D8B76A] px-4 py-2 text-sm text-[#070A13] disabled:opacity-40 cursor-pointer">Send RSVP Reminder to selected pending guests</button>
          <button type="button" disabled={busy || loading} onClick={refresh} className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-40 cursor-pointer">Refresh reminder history</button>
        </div>
        {loading && <div role="status" className="h-12 animate-pulse rounded-lg bg-white/5">Loading reminder history…</div>}
        {!pending.length && <p className="text-sm text-white/60">No guests are awaiting an RSVP.</p>}
        <ul className="space-y-3">
          {pending.map((guest) => {
            const record = latest(guest._id);
            return <li key={guest._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 p-3">
              <input type="checkbox" aria-label={`Select ${guest.guestName} for RSVP reminder`} checked={selected.includes(guest._id)} disabled={disabled || !canSend(guest)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, guest._id] : previous.filter((id) => id !== guest._id))} />
              <span className="flex-1 text-sm">{guest.guestName}</span>
              <button type="button" disabled={disabled || !canSend(guest)} onClick={() => send([guest._id])} className="rounded-lg border border-[#D8B76A]/40 px-3 py-2 text-xs text-[#D8B76A] disabled:opacity-40 cursor-pointer">Send RSVP Reminder</button>
              {record && <p className="w-full text-xs text-white/60">{failureMessages[record.deliveryStatus] || record.failureReason || `Reminder: ${record.deliveryStatus === "not_sent" ? record.sendStatus : record.deliveryStatus}`}</p>}
            </li>;
          })}
        </ul>
      </div>}
    </section>
  );
}
