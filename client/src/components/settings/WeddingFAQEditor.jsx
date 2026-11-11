import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import api from "../../utils/api";

// Mirrors the server FAQ contract; server validation remains authoritative.
const LIMITS = { items: 10, question: 200, answer: 1500 };
export default function WeddingFAQEditor() {
  const [faq, setFaq] = useState({ enabled: false, items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [saved, setSaved] = useState("");
  const [validated, setValidated] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [removed, setRemoved] = useState(null);
  const [popup, setPopup] = useState(null);
  const form = useRef(null);
  const dialog = useRef(null);
  const focusTarget = useRef(null);
  const inFlight = useRef(false);
  useLayoutEffect(() => {
    if (!focusTarget.current) return;
    const input = form.current?.elements.namedItem(focusTarget.current);
    if (input) {
      input.focus(); input.scrollIntoView?.({ block: "nearest", behavior: "instant" });
      focusTarget.current = null;
    }
  });
  useEffect(() => {
    if (popup && !dialog.current.open) dialog.current.showModal();
  }, [popup]);
  const closePopup = () => { dialog.current?.close(); setPopup(null); };
  const snapshot = (value) => JSON.stringify({ enabled: value.enabled, items: value.items.map(({ question, answer }) => ({ question, answer })) });
  const fieldError = (item, field) => typeof item[field] !== "string" ? `Invalid ${field}. Enter text.` :
    !item[field].trim() ? `Enter ${field === "question" ? "a question" : "an answer"} or remove this FAQ item.` :
    item[field].trim().length > LIMITS[field] ? `Keep the ${field} to ${LIMITS[field]} characters or fewer.` : "";
  const nextId = useRef(0);
  useEffect(() => {
    let active = true;
    api.get("/auth/me").then(({ data }) => {
      if (!active) return;
      const stored = data.weddingSite?.faq;
      if (stored && (typeof stored.enabled !== "boolean" || !Array.isArray(stored.items) || stored.items.some((item) =>
        !item || typeof item.question !== "string" || typeof item.answer !== "string"))) throw new Error("Malformed FAQ data");
      const loaded = { enabled: stored?.enabled === true, items: (stored?.items || []).map((item) => ({ ...item, key: nextId.current++ })) };
      setFaq(loaded); setSaved(snapshot(loaded));
      setLoading(false);
      setError("");
    }).catch(() => { if (active) setError("Could not load valid FAQ data. Retry before editing."); });
    return () => { active = false; };
  }, [reload]);
  const change = (key, field, value) => {
    setNotice("");
    setFaq((previous) => ({ ...previous, items: previous.items.map((item) => item.key === key ? { ...item, [field]: value } : item) }));
  };
  async function save(event) {
    event.preventDefault();
    if (inFlight.current || loading) return;
    setValidated(true);
    setNotice("");
    if (faq.items.length > LIMITS.items || faq.items.some((item) => fieldError(item, "question") || fieldError(item, "answer"))) {
      setError(faq.items.length > LIMITS.items ? "Use up to 10 FAQ entries. Remove extra items before saving." : "Complete every question and answer within the displayed limits. Check the highlighted fields or remove incomplete items.");
      const index = faq.items.findIndex((item) => fieldError(item, "question") || fieldError(item, "answer"));
      if (index >= 0) {
        const field = fieldError(faq.items[index], "question") ? "question" : "answer";
        focusTarget.current = `faq-${faq.items[index].key}-${field}`;
        setExpanded((previous) => ({ ...previous, ...Object.fromEntries(faq.items.filter((item) => fieldError(item, "question") || fieldError(item, "answer")).map((item) => [item.key, true])) }));
      }
      return;
    }
    inFlight.current = true;
    setSaving(true); setError("");
    const items = faq.items.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }));
    try {
      await api.put("/auth/me", { weddingSite: { faq: { enabled: faq.enabled, items } } });
      setFaq((previous) => ({ ...previous, items: previous.items.map((item, index) => ({ ...item, ...items[index] })) }));
      setSaved(snapshot({ enabled: faq.enabled, items })); setValidated(false);
      setNotice("Wedding FAQ saved.");
      setPopup({ type: "success" });
    } catch (failure) {
      const message = failure.response?.data?.message;
      setError(failure.response?.status >= 400 && failure.response?.status < 500 && typeof message === "string" && message.trim()
        ? message : "Could not save your FAQ. Your edits are still here; please try again.");
    }
    finally { inFlight.current = false; setSaving(false); }
  }
  const control = "mt-2 w-full min-w-0 rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D8B76A] focus:ring-2 focus:ring-[#D8B76A]/20 aria-invalid:border-red-400";
  const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/70 hover:border-[#D8B76A]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8B76A] disabled:opacity-50";
  const dirty = !loading && snapshot(faq) !== saved;
  return (
    <><form ref={form} noValidate onSubmit={save} className="invite-feature-card min-w-0 space-y-5 rounded-2xl border border-white/10 bg-[#0D1220] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-serif text-2xl text-[#D8B76A]">Wedding FAQ</h2>
          <p className="mt-1 text-sm text-white/70">A little clarity before the celebration.</p></div>
        {!loading && <button type="submit" disabled={saving} className="rounded-xl bg-[#D8B76A] px-4 py-2 font-semibold text-[#070A13] disabled:opacity-50">{saving ? "Saving…" : "Save FAQ"}</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {notice && <p role="status" className="text-sm text-[#D8B76A]">{notice}</p>}
      {dirty && <p className="text-sm font-medium text-[#D8B76A]">Unsaved changes — select Save FAQ to apply them.</p>}
      {loading ? error ? <button type="button" onClick={() => setReload(reload + 1)}>Retry loading FAQ</button> :
        <div role="status" className="h-24 animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none">Loading FAQ…</div> : (
        <fieldset disabled={saving} className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#D8B76A]/20 bg-[#D8B76A]/5 p-4">
            <div className="min-w-0">
              <span id="faq-visibility-label" className="text-sm font-semibold text-white">Show FAQ on your invitation</span>
              <p id="faq-visibility-help" className="mt-1 text-xs leading-relaxed text-white/60">Visibility and answer changes apply after Save. Empty FAQs stay hidden.</p>
            </div>
            <button type="button" role="switch" aria-checked={faq.enabled} aria-labelledby="faq-visibility-label" aria-describedby="faq-visibility-help"
              onClick={() => { setFaq({ ...faq, enabled: !faq.enabled }); setNotice(""); }}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D8B76A] ${faq.enabled ? "bg-[#D8B76A]" : "bg-white/20"}`}>
              <span aria-hidden="true" className={`h-5 w-5 rounded-full bg-[#070A13] ${faq.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-white/60">{faq.items.length} / {LIMITS.items} questions</p>
            <span className="rounded-full border border-[#D8B76A]/40 px-3 py-1 text-xs text-[#D8B76A]">{saved && JSON.parse(saved).enabled ? "Published" : "Draft"}</span>
          </div>
          {removed && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D8B76A]/25 px-4 py-3 text-sm text-white/70">
            <p>Question removed. Save to apply the removal.</p>
            <button type="button" name="faq-undo" disabled={faq.items.length >= LIMITS.items} className={secondaryButton} onClick={() => {
              const items = [...faq.items]; items.splice(Math.min(removed.index, items.length), 0, removed.item);
              focusTarget.current = `faq-${removed.item.key}-${expanded[removed.item.key] ? "question" : "edit"}`;
              setFaq({ ...faq, items }); setRemoved(null); setNotice("");
            }}><Icon icon="lucide:undo-2" aria-hidden="true" />Undo</button>
            {faq.items.length >= LIMITS.items && <p className="w-full text-xs">Remove an item to make room before undoing.</p>}
          </div>}
          {faq.items.length === 0 && <div className="rounded-xl border border-dashed border-[#D8B76A]/30 px-5 py-8 text-center">
            <Icon icon="lucide:messages-square" className="mx-auto mb-3 h-6 w-6 text-[#D8B76A]" aria-hidden="true" />
            <h3 className="font-serif text-xl text-white">Make guests feel prepared</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">Share helpful details about parking, dress code, or what to expect. Add your first question below.</p>
          </div>}
          {faq.items.map((item, index) => (
            <div key={item.key} className={`min-w-0 rounded-xl border p-4 ${validated && (fieldError(item, "question") || fieldError(item, "answer")) ? "border-red-400/60" : "border-white/10"}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#D8B76A]">Question {index + 1}</p>
                  <h3 className="mt-1 break-words text-sm font-semibold leading-relaxed text-white [overflow-wrap:anywhere]">{item.question.trim() || "Untitled question"}</h3>
                  {!expanded[item.key] && <p className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-white/60 [overflow-wrap:anywhere]">{item.answer.trim() || "Add an answer for your guests."}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {!expanded[item.key] && <button type="button" name={`faq-${item.key}-edit`} aria-label={`Edit question ${index + 1}`} aria-expanded={false} aria-controls={`faq-${item.key}-editor`} className={secondaryButton}
                    onClick={() => { focusTarget.current = `faq-${item.key}-question`; setExpanded({ ...expanded, [item.key]: true }); }}><Icon icon="lucide:pencil" aria-hidden="true" />Edit</button>}
                  <button type="button" aria-label={`Delete question ${index + 1}`} className={secondaryButton} onClick={() => setPopup({ type: "delete", key: item.key })}><Icon icon="lucide:trash-2" aria-hidden="true" />Delete</button>
                </div>
              </div>
              {expanded[item.key] && <div id={`faq-${item.key}-editor`} className="mt-4 space-y-4 border-t border-white/10 pt-4">
                {["question", "answer"].map((field) => {
                  const id = `faq-${item.key}-${field}`;
                  const message = validated && fieldError(item, field);
                  const props = { id, name: id, className: control, maxLength: LIMITS[field], value: item[field], "aria-invalid": !!message,
                    "aria-describedby": `${id}-count${message ? ` ${id}-error` : ""}`, onChange: (event) => change(item.key, field, event.target.value) };
                  return <div key={field} className="min-w-0">
                    <label htmlFor={id} className="text-sm text-white">{field === "question" ? "Question" : "Answer"} {index + 1}</label>
                    {field === "question" ? <input {...props} /> : <textarea {...props} rows={4} />}
                    <p id={`${id}-count`} className="mt-1 text-xs text-white/60">{item[field].length} / {LIMITS[field]} characters</p>
                    {message && <p id={`${id}-error`} className="mt-1 text-sm text-red-400">{message}</p>}
                  </div>;
                })}
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className={secondaryButton} onClick={() => { focusTarget.current = `faq-${item.key}-edit`; setExpanded({ ...expanded, [item.key]: false }); }}><Icon icon="lucide:check" aria-hidden="true" />Done editing</button>
                  <p className="text-xs text-white/60">Edits still require Save FAQ.</p>
                </div>
              </div>}
            </div>
          ))}
          <button type="button" name="faq-add-question" disabled={faq.items.length >= LIMITS.items} className="rounded-xl border border-[#D8B76A]/40 px-4 py-2 text-[#D8B76A] disabled:opacity-50"
            onClick={() => { const key = nextId.current++; focusTarget.current = `faq-${key}-question`; setExpanded({ ...expanded, [key]: true }); setFaq({ ...faq, items: [...faq.items, { key, question: "", answer: "" }] }); setNotice(""); }}><span className="inline-flex items-center gap-2"><Icon icon="lucide:plus" aria-hidden="true" />Add question</span></button>
        </fieldset>
      )}
    </form>
    {popup && <dialog ref={dialog} aria-labelledby="faq-dialog-title" aria-describedby="faq-dialog-body" onCancel={() => setPopup(null)} onClose={() => setPopup(null)}
      className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-[#D8B76A]/30 bg-[#0D1220] p-6 text-white shadow-2xl backdrop:bg-black/60">
      <Icon icon={popup.type === "delete" ? "lucide:circle-alert" : "lucide:circle-check"} className="mb-3 h-7 w-7 text-[#D8B76A]" aria-hidden="true" />
      <h2 id="faq-dialog-title" className="font-serif text-2xl text-[#D8B76A]">{popup.type === "delete" ? "Remove this question?" : "FAQ saved"}</h2>
      <p id="faq-dialog-body" className="mt-3 break-words text-sm leading-relaxed text-white/70">{popup.type === "delete"
        ? "This removes the question and its answer from your list. Your invitation changes only after Save. You can undo the latest removal."
        : "Your frequently asked questions have been saved. Your invitation now uses these saved visibility settings and answers."}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" autoFocus className={secondaryButton} onClick={closePopup}>{popup.type === "delete" ? "Keep question" : "Close"}</button>
        {popup.type === "delete" && <button type="button" className="rounded-lg border border-[#D8B76A]/50 bg-[#D8B76A] px-4 py-2 text-sm font-semibold text-[#070A13]" onClick={() => {
          const index = faq.items.findIndex((item) => item.key === popup.key);
          if (index >= 0) { setRemoved({ item: faq.items[index], index }); setFaq({ ...faq, items: faq.items.filter((item) => item.key !== popup.key) }); setNotice(""); }
          focusTarget.current = "faq-undo";
          closePopup();
        }}>Remove question</button>}
      </div>
    </dialog>}</>
  );
}
