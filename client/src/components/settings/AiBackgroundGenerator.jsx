import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../utils/api";
import { useSettings } from "../../context/SettingsContext";
import { Icon } from "@iconify/react";

const STYLE_PRESETS = [
  "Luxury Gold",
  "Soft Floral",
  "Navy & Gold",
  "Emerald Green",
  "Burgundy Velvet",
  "Minimal Ivory",
  "Traditional Nigerian",
  "Modern White Wedding",
  "Watercolor Garden",
  "Royal Classic",
];

const MOOD_OPTIONS = [
  "Elegant & Romantic",
  "Opulent & Regal",
  "Serene & Minimalist",
  "Joyful & Festive",
  "Classic & Dignified",
];

const FLORAL_OPTIONS = [
  "Roses & Eucalyptus",
  "Gold Filigree & Ornaments",
  "Geometric Golden Frames",
  "Lush Tropical Botanicals",
  "Soft Watercolor Blooms",
  "None / Clean",
];

const CULTURAL_OPTIONS = [
  "None",
  "Traditional Nigerian (Aso-Ebi / Lace motifs)",
  "Asian Royal (Mandarin / Silk motifs)",
  "Western Classic",
  "Vintage Nordic / European",
];

const AiBackgroundGenerator = () => {
  const navigate = useNavigate();
  const settings = useSettings();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const tier = user.tier || "free";
  const isFree = tier === "free";

  // Form states
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[0]);
  const [colors, setColors] = useState(() => {
    if (Array.isArray(user.weddingColors) && user.weddingColors.length > 0) {
      return user.weddingColors.join(", ");
    }
    return "Burgundy, Gold, Ivory";
  });
  const [mood, setMood] = useState(MOOD_OPTIONS[0]);
  const [floralPreference, setFloralPreference] = useState(FLORAL_OPTIONS[0]);
  const [culturalInfluence, setCulturalInfluence] = useState(CULTURAL_OPTIONS[0]);
  const [extraNotes, setExtraNotes] = useState("");

  // Credits & Gallery states
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [credits, setCredits] = useState({ used: 0, limit: 0, remaining: 0 });
  const [generatedImages, setGeneratedImages] = useState([]);

  const fetchAiCredits = async () => {
    try {
      const res = await api.get("/ai/credits");
      if (res.data && res.data.imageCredits) {
        setCredits(res.data.imageCredits);
        setGeneratedImages(res.data.generatedImages || []);
      }
    } catch (err) {
      console.error("Failed to fetch AI credits:", err);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    fetchAiCredits();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (isFree) {
      toast.warning("AI image generation is available on Plus and Pro plans! Upgrade to unlock.", {
        toastId: "ai-img-free-lock",
      });
      navigate("/admin/billing");
      return;
    }

    if (credits.remaining <= 0) {
      toast.error(`You have reached your limit of ${credits.limit} AI image generation credits.`, {
        toastId: "ai-img-limit-reach",
      });
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        stylePreset,
        colors,
        mood,
        floralPreference,
        culturalInfluence,
        extraNotes,
      };

      const res = await api.post("/ai/generate-invitation-background", payload);

      if (res.data && res.data.success) {
        toast.success("AI Wedding Background generated successfully!");
        setGeneratedImages(res.data.generatedImages || []);
        setCredits((prev) => ({
          ...prev,
          used: res.data.creditsUsed,
          remaining: res.data.creditsRemaining,
          limit: res.data.limit,
        }));
      } else {
        toast.error(res.data?.message || "Failed to generate AI background.");
      }
    } catch (err) {
      console.error("AI Generation Error:", err);
      const errMsg = err.response?.data?.message || "Failed to generate AI background. Please try again.";
      toast.error(errMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyBackground = async (image) => {
    setApplyingId(image._id);
    try {
      const res = await api.post("/ai/apply-background", { imageUrl: image.imageUrl });
      if (res.data && res.data.success) {
        toast.success("Applied AI background to your invitation card!");
        if (settings?.setCustomCardBg) settings.setCustomCardBg(image.imageUrl);
        if (settings?.setCardTheme) settings.setCardTheme("custom");
        
        // Update local storage user object if present
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          stored.customCardBg = image.imageUrl;
          stored.cardTheme = "custom";
          localStorage.setItem("user", JSON.stringify(stored));
        } catch (e) {
          // ignore
        }

        setGeneratedImages((prev) =>
          prev.map((img) => ({
            ...img,
            usedAsBackground: img.imageUrl === image.imageUrl,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to apply background:", err);
      toast.error(err.response?.data?.message || "Failed to apply background.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this AI generated image?")) return;
    setDeletingId(imageId);
    try {
      const res = await api.delete(`/ai/generated-image/${imageId}`);
      if (res.data && res.data.success) {
        toast.info("Generated image deleted.");
        setGeneratedImages((prev) => prev.filter((img) => img._id !== imageId));
      }
    } catch (err) {
      console.error("Failed to delete generated image:", err);
      toast.error("Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-white/10 bg-[#0D1220] space-y-6">
      {/* Header & Credit Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-[#D8B76A] flex items-center gap-1.5">
              <Icon icon="lucide:sparkles" className="w-4 h-4 text-[#D8B76A] animate-pulse" />
              AI Invitation Background Generator
            </h3>
            {isFree && (
              <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Icon icon="lucide:lock" className="w-2.5 h-2.5" /> Upgrade Required
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/50 mt-1 leading-relaxed max-w-xl">
            Generate high-resolution, custom AI wedding invitation frame backgrounds matching your exact colors and style. The AI generates background graphics only — VowLink overlays your text seamlessly!
          </p>
        </div>

        {/* Credit Badge */}
        <div className="bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">AI Image Credits</p>
          {loadingCredits ? (
            <p className="text-xs text-white/40 animate-pulse">Checking...</p>
          ) : isFree ? (
            <p className="text-xs text-amber-400 font-semibold mt-0.5">0 of 0 (Free Plan)</p>
          ) : (
            <p className="text-xs text-[#D8B76A] font-bold mt-0.5">
              {credits.used} of {credits.limit} used ({credits.remaining} left)
            </p>
          )}
        </div>
      </div>

      {/* Free Plan Lock Banner */}
      {isFree && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Icon icon="lucide:palette" className="text-lg text-[#D8B76A] shrink-0" />
            <span>AI image generation is available on <strong>Plus</strong> (2 credits) and <strong>Pro</strong> (10 credits) plans.</span>
          </div>
          <button
            onClick={() => navigate("/admin/billing")}
            className="px-4 py-2 rounded-lg bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] font-bold text-xs uppercase tracking-wider whitespace-nowrap hover:opacity-90 transition cursor-pointer"
          >
            Upgrade Plan <Icon icon="lucide:arrow-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Style Preset */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1 font-semibold">
              1. Style Preset / Vibe
            </label>
            <select
              disabled={isFree}
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50"
            >
              {STYLE_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Wedding Colors */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1 font-semibold">
              2. Wedding Colors
            </label>
            <input
              type="text"
              disabled={isFree}
              placeholder="e.g. Emerald Green, Gold, Ivory"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50"
            />
          </div>

          {/* 3. Mood */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1 font-semibold">
              3. Mood / Aesthetic
            </label>
            <select
              disabled={isFree}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50"
            >
              {MOOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Floral / Decor Preference */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1 font-semibold">
              4. Floral & Frame Preference
            </label>
            <select
              disabled={isFree}
              value={floralPreference}
              onChange={(e) => setFloralPreference(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50"
            >
              {FLORAL_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Cultural Influence */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1 font-semibold">
              5. Cultural / Traditional Influence
            </label>
            <select
              disabled={isFree}
              value={culturalInfluence}
              onChange={(e) => setCulturalInfluence(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50"
            >
              {CULTURAL_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Extra Prompt Details */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] uppercase tracking-wider text-white/60 mb-1 font-semibold">
              6. Optional Extra Details
            </label>
            <input
              type="text"
              disabled={isFree}
              placeholder="e.g. subtle glitter shimmer, marble texture"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#070A13] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#D8B76A]/60 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Generate Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-[10px] text-white/40 flex items-center gap-1.5 italic">
            <Icon icon="lucide:lightbulb" className="w-3.5 h-3.5 text-[#D8B76A] shrink-0" />
            <span>“Generate a wedding invitation background or frame. Do not include names, dates, letters, words, or readable text in the image.”</span>
          </p>

          <button
            type="submit"
            disabled={isFree || generating || credits.remaining <= 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
              isFree || credits.remaining <= 0
                ? "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                : "bg-linear-to-r from-[#D8B76A] to-[#F2D894] text-[#070A13] hover:opacity-95 shadow-[0_4px_20px_rgba(216,183,106,0.2)]"
            }`}
          >
            {generating ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin text-sm" />
                <span>Generating AI Background...</span>
              </>
            ) : isFree ? (
              <>
                <Icon icon="lucide:lock" className="w-3.5 h-3.5" />
                <span>Upgrade to Generate</span>
              </>
            ) : credits.remaining <= 0 ? (
              <span>Limit Reached ({credits.used}/{credits.limit})</span>
            ) : (
              <>
                <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
                <span>Generate Background</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#D8B76A] flex items-center gap-1.5">
              <Icon icon="lucide:image" className="w-4 h-4 text-[#D8B76A]" />
              Your AI Generated Backgrounds ({generatedImages.length})
            </h4>
            <span className="text-[10px] text-white/40">Click 'Apply' to set as active invitation background</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedImages.map((img) => {
              const isApplied = settings?.customCardBg === img.imageUrl || img.usedAsBackground;
              return (
                <div
                  key={img._id || img.imageUrl}
                  className={`rounded-xl border p-3 bg-[#070A13] flex flex-col justify-between gap-3 transition ${
                    isApplied ? "border-[#D8B76A] ring-1 ring-[#D8B76A]/40 shadow-lg" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-black/40 border border-white/5">
                      <img
                        src={img.imageUrl}
                        alt={img.stylePreset || "AI Background"}
                        className="w-full h-full object-cover"
                      />
                      {isApplied && (
                        <span className="absolute top-2 right-2 bg-[#D8B76A] text-[#070A13] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md">
                          Active
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{img.stylePreset || "AI Background"}</p>
                      <p className="text-[9px] text-white/40">
                        {img.createdAt ? new Date(img.createdAt).toLocaleDateString("en-GB") : "Recently created"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      disabled={applyingId === img._id || isApplied}
                      onClick={() => handleApplyBackground(img)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 ${
                        isApplied
                          ? "bg-[#D8B76A]/20 text-[#D8B76A] border border-[#D8B76A]/40"
                          : "bg-white/10 text-white hover:bg-[#D8B76A] hover:text-[#070A13]"
                      }`}
                    >
                      {applyingId === img._id ? (
                        <Icon icon="lucide:loader-2" className="animate-spin text-sm" />
                      ) : isApplied ? (
                        <span className="inline-flex items-center gap-1"><Icon icon="lucide:check" className="h-3 w-3" /> Active</span>
                      ) : (
                        "Apply"
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === img._id}
                      onClick={() => handleDeleteImage(img._id)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-red-400/80 hover:text-red-400 border border-red-400/20 hover:bg-red-400/10 transition cursor-pointer flex items-center justify-center"
                      title="Delete image"
                    >
                      {deletingId === img._id ? <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiBackgroundGenerator;
