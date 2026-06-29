import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";

const TONES = [
  { value: "elegant",     label: "Elegant" },
  { value: "romantic",    label: "Romantic" },
  { value: "formal",      label: "Formal" },
  { value: "friendly",    label: "Friendly" },
  { value: "traditional", label: "Traditional" },
  { value: "short",       label: "Short & Sweet" },
];

const inputBase =
  "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition";
const inputOk =
  "border-white/10 focus:border-[#D8B76A]/60 focus:ring-1 focus:ring-[#D8B76A]/30";

/**
 * AiMessageAssist — AI-powered wedding invitation message generator.
 *
 * Props:
 *  - guestName     {string}   Current guest name from the form
 *  - coupleNames   {string}   e.g. "Allen and Justina"
 *  - weddingDate   {string}   Formatted wedding date string
 *  - currentMessage {string}  The current customMessage value (for Rewrite mode)
 *  - onApply       {function} Called with the final text to insert into the field
 */
const AiMessageAssist = ({ guestName, coupleNames, weddingDate, currentMessage, onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tone, setTone] = useState("elegant");
  const [extraNotes, setExtraNotes] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(null); // { used, limit, remaining }
  const [error, setError] = useState("");

  // Fetch credits when panel opens
  const fetchCredits = useCallback(async () => {
    try {
      const res = await api.get("/ai/credits");
      if (res.data.success) setCredits(res.data.textCredits);
    } catch {
      // Non-fatal — just won't show the credits badge
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchCredits();
  }, [isOpen, fetchCredits]);

  const callGenerate = async (action) => {
    setError("");
    setGeneratedText("");

    if (!coupleNames || coupleNames.trim().length < 3) {
      setError("Please fill in the Partner names in Settings before using AI Assist.");
      return;
    }
    if (!weddingDate || weddingDate.trim().length < 4) {
      setError("Please set a Wedding Date in Settings before using AI Assist.");
      return;
    }
    if (action === "rewrite" && (!currentMessage || currentMessage.trim().length === 0)) {
      setError("There is no existing message to rewrite. Use 'Generate with AI' instead.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/ai/generate-invitation-text", {
        coupleNames: coupleNames.trim(),
        guestName: (guestName || "").trim() || "our guest",
        weddingDate: weddingDate.trim(),
        tone,
        currentMessage: currentMessage || "",
        extraNotes: extraNotes.trim(),
        action,
      });

      if (res.data.success) {
        setGeneratedText(res.data.generatedText);
        setCredits((prev) => prev
          ? { ...prev, remaining: res.data.creditsRemaining, used: res.data.creditsUsed }
          : null
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to generate text. Please try again.";
      const upgradeRequired = err.response?.data?.upgradeRequired;
      setError(msg);
      if (upgradeRequired) {
        // Refresh credits to show exhausted state
        fetchCredits();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedText.trim()) return;
    onApply(generatedText.trim());
    setIsOpen(false);
    setGeneratedText("");
    setExtraNotes("");
    toast.success("AI message applied! Feel free to edit it before saving.");
  };

  const creditsExhausted = credits && credits.remaining === 0;
  const charCount = generatedText.length;

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
      >
        <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
        <span>AI Assist</span>
        {credits && (
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
            creditsExhausted
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-[#D8B76A]/10 text-[#D8B76A]/70 border border-[#D8B76A]/20"
          }`}>
            {creditsExhausted ? "No credits" : `${credits.remaining} left`}
          </span>
        )}
        <Icon icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"} className="ml-auto w-3 h-3 text-[#D8B76A]/70" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="mt-2 rounded-2xl border border-[#D8B76A]/20 bg-[#0A0F1E] p-4 sm:p-5 space-y-4 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[#D8B76A] flex items-center gap-1.5">
                <Icon icon="lucide:sparkles" className="w-4 h-4 text-[#D8B76A]" /> AI Assist
              </h4>
              <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">
                Generate elegant invitation wording based on your wedding details.
              </p>
            </div>
            {/* Credits badge */}
            {credits ? (
              <div className="flex-shrink-0 text-right">
                <p className={`text-[9px] font-bold uppercase tracking-wider ${creditsExhausted ? "text-red-400" : "text-[#D8B76A]/70"}`}>
                  Credits: {credits.remaining}/{credits.limit}
                </p>
                {creditsExhausted && (
                  <Link
                    to="/admin/billing"
                    className="text-[9px] text-amber-400 underline hover:text-amber-300 transition"
                  >
                    <span className="inline-flex items-center gap-1">
                      Upgrade <Icon icon="lucide:arrow-right" className="h-3 w-3" />
                    </span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
            )}
          </div>

          {/* Context info (read-only, auto-populated) */}
          <div className="grid grid-cols-2 gap-2 text-[10px] text-white/40">
            <div className="bg-white/3 border border-white/5 rounded-lg px-3 py-2">
              <span className="text-white/25 uppercase tracking-wider block mb-0.5">Couple</span>
              <span className="text-white/60 font-medium">{coupleNames || <em className="text-red-400/70">Not set</em>}</span>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-lg px-3 py-2">
              <span className="text-white/25 uppercase tracking-wider block mb-0.5">Date</span>
              <span className="text-white/60 font-medium">{weddingDate || <em className="text-red-400/70">Not set</em>}</span>
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={loading || creditsExhausted}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50 transition"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Extra notes */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1.5">
              Extra Notes <span className="text-white/25 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              disabled={loading || creditsExhausted}
              placeholder="e.g. Make it warm and personal, mention travelling from abroad..."
              className={`${inputBase} ${inputOk} text-xs disabled:opacity-50`}
            />
          </div>

          {/* Action buttons */}
          {/* Action buttons — stack vertically on mobile, side-by-side on sm+ */}
          {creditsExhausted ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center space-y-2">
              <p className="text-xs text-red-400 font-semibold">AI credits exhausted for your plan.</p>
              <p className="text-[10px] text-white/40">Upgrade to Plus or Pro to unlock more AI generations.</p>
              <Link
                to="/admin/billing"
                className="inline-block mt-1 px-5 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-400/20 transition"
              >
                <span className="inline-flex items-center gap-1">
                  Upgrade Plan <Icon icon="lucide:arrow-right" className="h-3 w-3" />
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => callGenerate("generate")}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#D8B76A]/10 border border-[#D8B76A]/30 text-[#D8B76A] hover:bg-[#D8B76A]/20 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <><Icon icon="lucide:loader-2" className="h-3.5 w-3.5 animate-spin" /><span>Generating...</span></>
                ) : (
                  <><Icon icon="lucide:sparkles" className="w-3.5 h-3.5" /><span>Generate with AI</span></>
                )}
              </button>
              <button
                type="button"
                disabled={loading || !currentMessage?.trim()}
                onClick={() => callGenerate("rewrite")}
                title={!currentMessage?.trim() ? "Write a message first, then rewrite it with AI" : "Rewrite current message"}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Icon icon="lucide:rotate-ccw" className="w-3.5 h-3.5" />
                <span>Rewrite Current</span>
              </button>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-400 leading-relaxed animate-fade-in">
              {error}
            </div>
          )}

          {/* Generated text preview */}
          {generatedText && !loading && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Generated Preview</span>
                <span className={`text-[10px] font-bold ${charCount > 170 ? "text-red-400" : "text-emerald-400"}`}>
                  {charCount}/170 chars
                </span>
              </div>
              {/* Editable — user can tweak before applying */}
              <textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                rows={3}
                maxLength={200}
                className={`${inputBase} ${inputOk} resize-none text-xs font-mono italic text-white/80 leading-relaxed`}
              />
              <p className="text-[9px] text-white/30">You can edit the text above before applying.</p>
              <button
                type="button"
                onClick={handleApply}
                disabled={!generatedText.trim() || charCount > 170}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] text-xs font-bold uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Icon icon="lucide:check" className="w-3.5 h-3.5" /> Apply to Invitation
              </button>
            </div>
          )}

          {/* Upgrade nudge for near-limit users */}
          {credits && credits.remaining <= 2 && credits.remaining > 0 && (
            <p className="text-[9px] text-amber-400/60 text-center">
              {credits.remaining === 1 ? "1 credit remaining." : `${credits.remaining} credits remaining.`}{" "}
              <Link to="/admin/billing" className="underline hover:text-amber-400 transition">Upgrade to Plus or Pro</Link> for more.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AiMessageAssist;
