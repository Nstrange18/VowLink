const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { checkAiCredits } = require("../utils/aiCredits");

const openai = new OpenAI({ apiKey: process.env.AI_API_SECRET_KEY });

// Valid tones and their GPT instruction modifiers
const TONE_INSTRUCTIONS = {
  formal:      "Write in a highly formal, dignified, and traditional style. Use elevated language.",
  romantic:    "Write in a deeply romantic, heartfelt, and poetic style. Evoke emotion and love.",
  friendly:    "Write in a warm, personal, and conversational style. Make it feel like a message from close friends.",
  short:       "Write an extremely concise message — no more than 2 short sentences. Keep it elegant but brief.",
  traditional: "Write in a classic, timeless wedding style. Use traditional wedding invitation phrasing.",
  elegant:     "Write in a refined, sophisticated, and elegant style. The language should feel luxurious and tasteful.",
};

// ── POST /api/ai/generate-invitation-text ─────────────────────────────────────
router.post("/generate-invitation-text", protect, async (req, res) => {
  try {
    const { coupleNames, guestName, weddingDate, tone, currentMessage, extraNotes, action } = req.body;

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!coupleNames || coupleNames.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Couple names are required to generate invitation text.",
      });
    }
    if (!weddingDate || weddingDate.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: "Wedding date is required to generate invitation text.",
      });
    }

    // ── Load user and check credits ───────────────────────────────────────────
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { allowed, remaining, limit } = checkAiCredits(user);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `You have used all ${limit} AI text generation${limit === 1 ? "" : "s"} included in your ${user.tier || "free"} plan. Upgrade to unlock more.`,
        creditsRemaining: 0,
        upgradeRequired: true,
      });
    }

    // ── Build the prompt ──────────────────────────────────────────────────────
    const resolvedTone = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.elegant;
    const guest = (guestName || "").trim() || "our guest";
    const isRewrite = action === "rewrite" && currentMessage && currentMessage.trim().length > 0;

    let userPrompt;
    if (isRewrite) {
      userPrompt =
        `Rewrite the following wedding invitation message in a more ${tone || "elegant"} way.\n\n` +
        `Couple: ${coupleNames.trim()}\n` +
        `Guest name: ${guest}\n` +
        `Wedding date: ${weddingDate.trim()}\n` +
        (extraNotes ? `Additional notes: ${extraNotes.trim()}\n` : "") +
        `\nOriginal message:\n"${currentMessage.trim()}"\n\n` +
        `Rewrite it now. Keep it under 170 characters. Do not include any prefix or quotes in your response.`;
    } else {
      userPrompt =
        `Write a short, personal wedding invitation message.\n\n` +
        `Couple: ${coupleNames.trim()}\n` +
        `Guest name: ${guest}\n` +
        `Wedding date: ${weddingDate.trim()}\n` +
        (extraNotes ? `Additional notes: ${extraNotes.trim()}\n` : "") +
        `\nWrite the message now. Keep it under 170 characters. Do not include any prefix or quotes in your response.`;
    }

    // ── Call OpenAI ───────────────────────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are an expert wedding invitation copywriter. ${resolvedTone} ` +
            `Your responses should be wedding-appropriate, elegant, and concise. ` +
            `Always address the guest by name. Never exceed 170 characters. ` +
            `Never include surrounding quotes or a label like "Message:" in your response. ` +
            `Respond with ONLY the invitation message text.`,
        },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 120,
      temperature: 0.8,
    });

    const generatedText = completion.choices[0]?.message?.content?.trim() || "";
    if (!generatedText) {
      return res.status(500).json({ success: false, message: "AI returned an empty response. Please try again." });
    }

    // ── Deduct credit and save ────────────────────────────────────────────────
    user.aiCreditsUsed = (user.aiCreditsUsed ?? 0) + 1;
    await user.save();

    const creditsRemaining = Math.max(0, remaining - 1);

    return res.json({
      success: true,
      generatedText,
      creditsRemaining,
      creditsUsed: user.aiCreditsUsed,
      limit: checkAiCredits(user).limit,
    });
  } catch (err) {
    console.error("[AI Route] Error:", err.message, "| status:", err?.status, "| code:", err?.error?.code, "| type:", err?.error?.type);

    // Distinguish OpenAI API errors from general server errors
    if (err?.status === 401) {
      return res.status(500).json({ success: false, message: "AI service configuration error. Please contact support." });
    }
    if (err?.status === 429) {
      // OpenAI returns 'insufficient_quota' when the account has no billing credits
      const isQuotaError =
        err?.error?.code === "insufficient_quota" ||
        err?.error?.type === "insufficient_quota" ||
        (err?.message && err.message.toLowerCase().includes("quota"));

      if (isQuotaError) {
        return res.status(503).json({
          success: false,
          message: "AI service is currently unavailable. Please try again later or contact support.",
        });
      }
      return res.status(429).json({ success: false, message: "AI service is temporarily busy. Please wait a moment and try again." });
    }

    return res.status(500).json({ success: false, message: "Failed to generate text. Please try again." });
  }
});

// ── GET /api/ai/credits ───────────────────────────────────────────────────────
// Returns the current user's AI credit status without consuming a credit.
router.get("/credits", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("tier aiCreditsUsed");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const { used, limit, remaining } = checkAiCredits(user);
    return res.json({ success: true, used, limit, remaining });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch credits." });
  }
});

module.exports = router;
