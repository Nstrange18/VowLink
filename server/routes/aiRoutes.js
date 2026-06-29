const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { checkAiCredits, checkAiImageCredits } = require("../utils/aiCredits");

const openai = new OpenAI({
  apiKey: process.env.AI_API_SECRET_KEY || process.env.OPENAI_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Valid tones and their GPT instruction modifiers
const TONE_INSTRUCTIONS = {
  formal:      "Write in a highly formal, dignified, and traditional style. Use elevated language.",
  romantic:    "Write in a deeply romantic, heartfelt, and poetic style. Evoke emotion and love.",
  friendly:    "Write in a warm, personal, and conversational style. Make it feel like a message from close friends.",
  short:       "Write an extremely concise message — no more than 2 short sentences. Keep it elegant but brief.",
  traditional: "Write in a classic, timeless wedding style. Use traditional wedding invitation phrasing.",
  elegant:     "Write in a refined, sophisticated, and elegant style. The language should feel luxurious and tasteful.",
};

// Safety term blocklist for AI prompts
const BLOCKED_TERMS = [
  "nude", "naked", "sex", "porn", "gore", "blood", "kill", "murder", "hate",
  "racist", "terror", "weapon", "gun", "celebrity", "disney", "marvel", "logo", "brand"
];

const checkSafety = (text) => {
  if (!text) return true;
  const lower = text.toLowerCase();
  return !BLOCKED_TERMS.some((term) => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lower);
  });
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
    console.error("[AI Route] Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to generate text. Please try again." });
  }
});

// ── POST /api/ai/generate-invitation-background ───────────────────────────────
router.post("/generate-invitation-background", protect, async (req, res) => {
  try {
    const { stylePreset, colors, mood, floralPreference, culturalInfluence, extraNotes } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { allowed, limit, remaining } = checkAiImageCredits(user);
    const isFree = (user.tier || "free") === "free";

    if (isFree || !allowed) {
      return res.status(403).json({
        success: false,
        message: isFree
          ? "AI image generation is available on Plus and Pro plans. Upgrade your plan to unlock."
          : `You have used all ${limit} AI image generation credits included in your ${user.tier} plan.`,
        creditsRemaining: 0,
        upgradeRequired: isFree || remaining <= 0,
      });
    }

    // Input safety check
    const combinedInputs = `${stylePreset || ""} ${colors || ""} ${mood || ""} ${floralPreference || ""} ${culturalInfluence || ""} ${extraNotes || ""}`;
    if (!checkSafety(combinedInputs)) {
      return res.status(400).json({
        success: false,
        message: "Inappropriate or non-wedding content detected in your input. Please keep prompts wedding-focused.",
      });
    }

    const preset = stylePreset || "Luxury Gold";
    const clr = colors ? colors.trim() : "harmonious wedding colors";
    const md = mood ? mood.trim() : "elegant and romantic";
    const flr = floralPreference ? floralPreference.trim() : "subtle floral ornaments";
    const cul = culturalInfluence ? culturalInfluence.trim() : "none";
    const extra = extraNotes ? extraNotes.trim() : "";

    const constructedPrompt =
      `Create an elegant wedding invitation background/frame in ${preset} style. ` +
      `Wedding colors: ${clr}. Mood: ${md}. Decor/floral preference: ${flr}. Cultural influence: ${cul}. ${extra} ` +
      `The design should have a clear central safe area for text overlay. ` +
      `Do not include any words, letters, numbers, names, dates, logos, watermarks, or readable text. ` +
      `High-quality vertical invitation card background, elegant, clean, premium.`;

    let response;
    try {
      response = await openai.images.generate({
        model: "dall-e-3",
        prompt: constructedPrompt,
        n: 1,
        size: "1024x1792",
        quality: "standard",
      });
    } catch (openAiErr) {
      console.error("OpenAI DALL-E generation error:", openAiErr.message);
      return res.status(500).json({
        success: false,
        message: "AI image generation failed. " + (openAiErr.message || "Please try again later."),
      });
    }

    const tempImageUrl = response?.data?.[0]?.url;
    if (!tempImageUrl) {
      return res.status(500).json({ success: false, message: "AI returned no image output. Please try again." });
    }

    // Save image to Cloudinary
    let uploadResult;
    try {
      uploadResult = await cloudinary.uploader.upload(tempImageUrl, {
        folder: "vowlink/ai_backgrounds",
      });
    } catch (cloudErr) {
      console.error("Cloudinary upload failed for AI generated image:", cloudErr);
      return res.status(500).json({ success: false, message: "Failed to save generated image to storage. Please try again." });
    }

    // Deduct credit and save record ONLY after successful generation and Cloudinary upload
    const newRecord = {
      imageUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      prompt: constructedPrompt,
      stylePreset: preset,
      colors: clr,
      mood: md,
      floralPreference: flr,
      culturalInfluence: cul,
      createdAt: new Date(),
      usedAsBackground: false,
    };

    user.aiImageCreditsUsed = (user.aiImageCreditsUsed ?? 0) + 1;
    user.aiGeneratedImages.push(newRecord);
    await user.save();

    const updatedCredits = checkAiImageCredits(user);
    const createdImage = user.aiGeneratedImages[user.aiGeneratedImages.length - 1];

    return res.json({
      success: true,
      image: createdImage,
      generatedImages: user.aiGeneratedImages,
      creditsUsed: updatedCredits.used,
      creditsRemaining: updatedCredits.remaining,
      limit: updatedCredits.limit,
    });
  } catch (err) {
    console.error("Error in generate-invitation-background:", err);
    return res.status(500).json({ success: false, message: "Failed to generate AI background. Please try again." });
  }
});

// ── POST /api/ai/apply-background ──────────────────────────────────────────────
router.post("/apply-background", protect, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Image URL is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.customCardBg = imageUrl;
    user.cardTheme = "custom";

    if (Array.isArray(user.aiGeneratedImages)) {
      user.aiGeneratedImages.forEach((img) => {
        img.usedAsBackground = img.imageUrl === imageUrl;
      });
    }

    await user.save();

    return res.json({
      success: true,
      message: "Applied AI generated image as custom background!",
      customCardBg: user.customCardBg,
      cardTheme: user.cardTheme,
      aiGeneratedImages: user.aiGeneratedImages,
    });
  } catch (err) {
    console.error("Error applying AI background:", err);
    return res.status(500).json({ success: false, message: "Failed to apply background." });
  }
});

// ── DELETE /api/ai/generated-image/:id ────────────────────────────────────────
router.delete("/generated-image/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const targetImg = user.aiGeneratedImages.id(id);
    if (!targetImg) {
      return res.status(404).json({ success: false, message: "Generated image not found." });
    }

    if (targetImg.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(targetImg.cloudinaryPublicId);
      } catch (cloudErr) {
        console.warn("Cloudinary delete warning:", cloudErr.message);
      }
    }

    user.aiGeneratedImages.pull(id);
    await user.save();

    return res.json({
      success: true,
      message: "Generated image deleted successfully.",
      generatedImages: user.aiGeneratedImages,
    });
  } catch (err) {
    console.error("Error deleting generated image:", err);
    return res.status(500).json({ success: false, message: "Failed to delete generated image." });
  }
});

// ── GET /api/ai/credits ────────────────(Text & Image credits)──────────────────
router.get("/credits", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("tier aiCreditsUsed aiImageCreditsUsed aiGeneratedImages");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const textCredits = checkAiCredits(user);
    const imageCredits = checkAiImageCredits(user);

    return res.json({
      success: true,
      textCredits,
      imageCredits,
      generatedImages: user.aiGeneratedImages || [],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch credits." });
  }
});

module.exports = router;
