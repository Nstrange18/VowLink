const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const sgMail = require("@sendgrid/mail");
const { sendHoneymoonGoalReachedNotification } = require("../utils/email");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────
// These protect sensitive auth routes from spam, brute-force attempts, and abuse.

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // 8 login attempts per IP every 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please wait 15 minutes and try again.",
  },
});

const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 signup attempts per IP every hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many signup attempts. Please try again later.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 password reset requests per IP every 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please wait 15 minutes and try again.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 reset attempts per IP every 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset attempts. Please wait 15 minutes and try again.",
  },
});

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const normalizePublicImageUrl = (url) => {
  if (typeof url !== "string" || !url.startsWith("/")) return url || "";
  return url.replace(/\.(png|jpe?g)$/i, ".webp");
};

const normalizeCustomTextColors = (colors = {}) => {
  const allowed = ["title", "subtitle", "coupleNames", "greeting", "message", "details", "reception", "colors"];
  return allowed.reduce((acc, key) => {
    const value = colors?.[key];
    acc[key] = typeof value === "string" ? value.trim() : "";
    return acc;
  }, {});
};

// ── Token helpers ─────────────────────────────────────────────────────────────
const userPayload = (user) => ({
  id: user._id,
  partner1Name: user.partner1Name,
  partner2Name: user.partner2Name,
  email: user.email,
  weddingDate: user.weddingDate,
  weddingTime: user.weddingTime,
  rsvpDeadline: user.rsvpDeadline,
  venue: user.venue,
  venueName: user.venueName || "",
  receptionLocation: user.receptionLocation || "",
  receptionName: user.receptionName || "",
  weddingColors: user.weddingColors || [],
  dressCode: user.dressCode || "",
  plusOnePolicy: user.plusOnePolicy || "invitation_only",
  kidsAllowed: typeof user.kidsAllowed === "boolean" ? user.kidsAllowed : true,
  tier: user.tier || "unpaid",
  cardTheme: user.cardTheme || "floral",
  defaultGuestTheme: ["dark", "light", "system"].includes(user.defaultGuestTheme) ? user.defaultGuestTheme : "dark",
  customTextColor: user.customTextColor || "#1A2E4A",
  customTextColors: normalizeCustomTextColors(user.customTextColors),
  userHasCustomTextColor: typeof user.userHasCustomTextColor === "boolean" ? user.userHasCustomTextColor : false,
  customFontFamily: user.customFontFamily || "classic",
  customVerticalOffset: typeof user.customVerticalOffset === "number" ? user.customVerticalOffset : 0,
  customTextSize: typeof user.customTextSize === "number" ? user.customTextSize : 1.0,
  customTextSizeTitle: typeof user.customTextSizeTitle === "number" ? user.customTextSizeTitle : 1.0,
  customTextSizeSubtitle: typeof user.customTextSizeSubtitle === "number" ? user.customTextSizeSubtitle : 1.0,
  customTextSizeCoupleNames: typeof user.customTextSizeCoupleNames === "number" ? user.customTextSizeCoupleNames : 1.0,
  customTextSizeGreeting: typeof user.customTextSizeGreeting === "number" ? user.customTextSizeGreeting : 1.0,
  customTextSizeMessage: typeof user.customTextSizeMessage === "number" ? user.customTextSizeMessage : 1.0,
  customTextSizeDetails: typeof user.customTextSizeDetails === "number" ? user.customTextSizeDetails : 1.0,
  customTextSizeReception: typeof user.customTextSizeReception === "number" ? user.customTextSizeReception : 1.0,
  customTextSizeColors: typeof user.customTextSizeColors === "number" ? user.customTextSizeColors : 1.0,
  customTextBoldness: user.customTextBoldness || "normal",
  coupleOverlayOpacity: typeof user.coupleOverlayOpacity === "number" ? user.coupleOverlayOpacity : 0.45,
  musicUrl: user.musicUrl || "",
  shortlistedVenues: user.shortlistedVenues || [],
  role: (user.role === "admin" && user.email?.toLowerCase() === "nwubachukwuemelie@gmail.com") ? "admin" : "user",
  customTextAlign: user.customTextAlign || "center",
  userHasCustomAlignment: typeof user.userHasCustomAlignment === "boolean" ? user.userHasCustomAlignment : false,
  customHorizontalOffset: typeof user.customHorizontalOffset === "number" ? user.customHorizontalOffset : 0,
  smartLayoutEnabled: typeof user.smartLayoutEnabled === "boolean" ? user.smartLayoutEnabled : true,
  registryEnabled: typeof user.registryEnabled === "boolean" ? user.registryEnabled : false,
  registryBankName: user.registryBankName || "",
  registryAccountName: user.registryAccountName || "",
  registryAccountNumber: user.registryAccountNumber || "",
  registryNotes: user.registryNotes || "",
  honeymoonFundTarget: typeof user.honeymoonFundTarget === "number" ? user.honeymoonFundTarget : 0,
  honeymoonFundCurrent: typeof user.honeymoonFundCurrent === "number" ? user.honeymoonFundCurrent : 0,
});

const generateAccessToken = (user) =>
  jwt.sign(userPayload(user), process.env.JWT_SECRET, { expiresIn: "1h" });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });

const userPublic = (user) => ({
  id: user._id,
  partner1Name: user.partner1Name,
  partner2Name: user.partner2Name,
  email: user.email,
  weddingDate: user.weddingDate,
  weddingTime: user.weddingTime,
  rsvpDeadline: user.rsvpDeadline,
  venue: user.venue,
  venueName: user.venueName || "",
  receptionLocation: user.receptionLocation || "",
  receptionName: user.receptionName || "",
  weddingColors: user.weddingColors || [],
  dressCode: user.dressCode || "",
  plusOnePolicy: user.plusOnePolicy || "invitation_only",
  kidsAllowed: typeof user.kidsAllowed === "boolean" ? user.kidsAllowed : true,
  tier: user.tier || "unpaid",
  // NOTE: galleryPhotos, customCardBg, couplePhotoUrl are intentionally excluded here.
  // They can be large base64 strings (MBs) that crash localStorage.setItem() with QuotaExceededError.
  // These are fetched separately by the settings page via GET /api/auth/me.
  cardTheme: user.cardTheme || "floral",
  defaultGuestTheme: ["dark", "light", "system"].includes(user.defaultGuestTheme) ? user.defaultGuestTheme : "dark",
  customTextColor: user.customTextColor || "#1A2E4A",
  customTextColors: normalizeCustomTextColors(user.customTextColors),
  userHasCustomTextColor: typeof user.userHasCustomTextColor === "boolean" ? user.userHasCustomTextColor : false,
  customFontFamily: user.customFontFamily || "classic",
  customVerticalOffset: typeof user.customVerticalOffset === "number" ? user.customVerticalOffset : 0,
  customTextSize: typeof user.customTextSize === "number" ? user.customTextSize : 1.0,
  customTextSizeTitle: typeof user.customTextSizeTitle === "number" ? user.customTextSizeTitle : 1.0,
  customTextSizeSubtitle: typeof user.customTextSizeSubtitle === "number" ? user.customTextSizeSubtitle : 1.0,
  customTextSizeCoupleNames: typeof user.customTextSizeCoupleNames === "number" ? user.customTextSizeCoupleNames : 1.0,
  customTextSizeGreeting: typeof user.customTextSizeGreeting === "number" ? user.customTextSizeGreeting : 1.0,
  customTextSizeMessage: typeof user.customTextSizeMessage === "number" ? user.customTextSizeMessage : 1.0,
  customTextSizeDetails: typeof user.customTextSizeDetails === "number" ? user.customTextSizeDetails : 1.0,
  customTextSizeReception: typeof user.customTextSizeReception === "number" ? user.customTextSizeReception : 1.0,
  customTextSizeColors: typeof user.customTextSizeColors === "number" ? user.customTextSizeColors : 1.0,
  customTextBoldness: user.customTextBoldness || "normal",
  coupleOverlayOpacity: typeof user.coupleOverlayOpacity === "number" ? user.coupleOverlayOpacity : 0.45,
  musicUrl: user.musicUrl || "",
  customShareMessage: user.customShareMessage || "",
  shortlistedVenues: user.shortlistedVenues || [],
  pageBgTemplate: user.pageBgTemplate || "",
  role: (user.role === "admin" && user.email?.toLowerCase() === "nwubachukwuemelie@gmail.com") ? "admin" : "user",
  customTextAlign: user.customTextAlign || "center",
  userHasCustomAlignment: typeof user.userHasCustomAlignment === "boolean" ? user.userHasCustomAlignment : false,
  customHorizontalOffset: typeof user.customHorizontalOffset === "number" ? user.customHorizontalOffset : 0,
  smartLayoutEnabled: typeof user.smartLayoutEnabled === "boolean" ? user.smartLayoutEnabled : true,
  registryEnabled: typeof user.registryEnabled === "boolean" ? user.registryEnabled : false,
  registryBankName: user.registryBankName || "",
  registryAccountName: user.registryAccountName || "",
  registryAccountNumber: user.registryAccountNumber || "",
  registryNotes: user.registryNotes || "",
  honeymoonFundTarget: typeof user.honeymoonFundTarget === "number" ? user.honeymoonFundTarget : 0,
  honeymoonFundCurrent: typeof user.honeymoonFundCurrent === "number" ? user.honeymoonFundCurrent : 0,
});

// ── Email helper ──────────────────────────────────────────────────────────────
const sendResetEmail = async (email, resetUrl) => {
  console.log("[sendResetEmail] Attempting to send reset email to:", email);

  if (!process.env.SENDGRID_API_KEY) {
    console.error("[sendResetEmail] SendGrid API key missing");
    throw new Error("SendGrid API key not configured");
  }

  try {
    await sgMail.send({
      to: email,
      from: "noreplybiru556@gmail.com",
      subject: "Reset your VowLink password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
          <h2 style="color:#1A2E4A;font-size:22px;margin-bottom:8px">Reset your password</h2>
          <p style="color:#444;line-height:1.6">Click the button below to reset your VowLink password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#D8B76A;color:#1A2E4A;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:bold;letter-spacing:1px;margin:20px 0;font-size:14px">
            Reset Password
          </a>
          <p style="color:#999;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log("[sendResetEmail] Email sent successfully to:", email);
  } catch (error) {
    console.error("[sendResetEmail] Failed to send email");
    console.error("[sendResetEmail] Error:", error.message);
    throw error;
  }
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const {
      partner1Name,
      partner2Name,
      email,
      password,
      weddingDate,
      weddingTime,
      rsvpDeadline,
      venue,
      receptionLocation,
      weddingColors,
      dressCode,
      plusOnePolicy,
      kidsAllowed,
    } = req.body;
    if (!partner1Name || !partner2Name || !email || !password)
      return res.status(400).json({ message: "All fields are required." });
    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      partner1Name,
      partner2Name,
      email,
      password: hashed,
      weddingDate: weddingDate || null,
      weddingTime: weddingTime || "18:00",
      rsvpDeadline: rsvpDeadline || null,
      venue: venue || "",
      receptionLocation: receptionLocation || "",
      weddingColors: Array.isArray(weddingColors) ? weddingColors : [],
      dressCode: dressCode || "",
      plusOnePolicy:
        plusOnePolicy === "plus_one_allowed"
          ? "plus_one_allowed"
          : "invitation_only",
      kidsAllowed: typeof kidsAllowed === "boolean" ? kidsAllowed : true,
    });

    res.status(201).json({
      message: "Account created successfully",
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user._id),
      user: userPublic(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const { password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "Account does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password." });

    res.status(200).json({
      message: "Login successful",
      accessToken: generateAccessToken(user),
      refreshToken: generateRefreshToken(user._id),
      user: userPublic(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token required." });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found." });
    res.status(200).json({ accessToken: generateAccessToken(user) });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired refresh token. Please log in again.",
    });
  }
});

// ── GET /api/auth/me — fetch full profile (including media fields) ────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -checkInPinHash -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

// ── CHECK-IN PIN: status for couple dashboard ───────────────────────────────
router.get("/check-in-pin", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("checkInPinHash checkInPinUpdatedAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      enabled: Boolean(user.checkInPinHash),
      updatedAt: user.checkInPinUpdatedAt || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load check-in PIN status", error: error.message });
  }
});

// ── CHECK-IN PIN: create/reset event access PIN ─────────────────────────────
router.put("/check-in-pin", protect, async (req, res) => {
  try {
    const { pin } = req.body;
    const normalizedPin = String(pin || "").trim();

    if (!/^\d{4,8}$/.test(normalizedPin)) {
      return res.status(400).json({ message: "Check-in PIN must be 4 to 8 digits." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!["plus", "pro"].includes(user.tier || "unpaid")) {
      return res.status(403).json({ message: "Event check-in PINs are available on Plus and Pro plans." });
    }

    user.checkInPinHash = await bcrypt.hash(normalizedPin, 10);
    user.checkInPinUpdatedAt = new Date();
    await user.save();

    res.status(200).json({
      message: "Check-in PIN updated. Ushers can use it for event entry only.",
      enabled: true,
      updatedAt: user.checkInPinUpdatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update check-in PIN", error: error.message });
  }
});

// ── CHECK-IN PIN: disable event access PIN ──────────────────────────────────
router.delete("/check-in-pin", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.checkInPinHash = "";
    user.checkInPinUpdatedAt = undefined;
    await user.save();

    res.status(200).json({ message: "Check-in PIN disabled.", enabled: false, updatedAt: null });
  } catch (error) {
    res.status(500).json({ message: "Failed to disable check-in PIN", error: error.message });
  }
});

// ── PUT /api/auth/me — update profile ────────────────────────────────────────
router.put("/me", protect, async (req, res) => {
  try {
    const {
      partner1Name,
      partner2Name,
      weddingDate,
      weddingTime,
      rsvpDeadline,
      venue,
      venueName,
      receptionLocation,
      receptionName,
      weddingColors,
      dressCode,
      plusOnePolicy,
      kidsAllowed,
      cardTheme,
      defaultGuestTheme,
      customCardBg,
      pageBgTemplate,
      customTextColor,
      customTextColors,
      customFontFamily,
      customVerticalOffset,
      customTextSize,
      customTextSizeTitle,
      customTextSizeSubtitle,
      customTextSizeCoupleNames,
      customTextSizeGreeting,
      customTextSizeMessage,
      customTextSizeDetails,
      customTextSizeReception,
      customTextSizeColors,
      customTextBoldness,
      musicUrl,
      galleryPhotos,
      couplePhotoUrl,
      customShareMessage,
      coupleOverlayOpacity,
      customTextAlign,
      userHasCustomAlignment,
      userHasCustomTextColor,
      customHorizontalOffset,
      smartLayoutEnabled,
      registryEnabled,
      registryBankName,
      registryAccountName,
      registryAccountNumber,
      registryNotes,
      honeymoonFundTarget,
      honeymoonFundCurrent,
      timeline,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const normalizedCustomCardBg = customCardBg !== undefined ? normalizePublicImageUrl(customCardBg) : undefined;
    const normalizedPageBgTemplate = pageBgTemplate !== undefined ? normalizePublicImageUrl(pageBgTemplate) : undefined;

    // Update timeline if provided
    if (timeline !== undefined && Array.isArray(timeline)) {
      user.timeline = timeline;
    }

    // Validate honeymoon fund target vs current
    const targetVal = honeymoonFundTarget !== undefined ? Number(honeymoonFundTarget) : user.honeymoonFundTarget;
    const currentVal = honeymoonFundCurrent !== undefined ? Number(honeymoonFundCurrent) : user.honeymoonFundCurrent;

    if (currentVal > targetVal && targetVal > 0) {
      return res.status(400).json({ message: "Current contribution cannot exceed the target goal." });
    }

    // Update basic settings safely (only if defined in request payload)
    if (partner1Name !== undefined) user.partner1Name = partner1Name;
    if (partner2Name !== undefined) user.partner2Name = partner2Name;
    
    if (weddingDate !== undefined) {
      const oldDateStr = user.weddingDate ? new Date(user.weddingDate).toDateString() : "";
      const newDateStr = weddingDate ? new Date(weddingDate).toDateString() : "";
      if (newDateStr !== oldDateStr) {
        user.weddingEmailSent = false;
      }
      user.weddingDate = weddingDate || null;
    }
    
    if (weddingTime !== undefined) user.weddingTime = weddingTime || "18:00";
    if (rsvpDeadline !== undefined) user.rsvpDeadline = rsvpDeadline || null;
    if (venue !== undefined) user.venue = venue || "";
    if (venueName !== undefined) user.venueName = venueName || "";
    if (receptionLocation !== undefined) user.receptionLocation = receptionLocation || "";
    if (receptionName !== undefined) user.receptionName = receptionName || "";
    if (weddingColors !== undefined) user.weddingColors = Array.isArray(weddingColors) ? weddingColors : [];
    if (dressCode !== undefined) user.dressCode = dressCode || "";
    if (plusOnePolicy !== undefined) {
      user.plusOnePolicy = plusOnePolicy === "plus_one_allowed" ? "plus_one_allowed" : "invitation_only";
    }
    if (kidsAllowed !== undefined) user.kidsAllowed = typeof kidsAllowed === "boolean" ? kidsAllowed : true;
    if (defaultGuestTheme !== undefined && ["dark", "light", "system"].includes(defaultGuestTheme)) {
      user.defaultGuestTheme = defaultGuestTheme;
    }

    // Update registry settings
    if (typeof registryEnabled === "boolean") user.registryEnabled = registryEnabled;
    if (registryBankName !== undefined) user.registryBankName = registryBankName;
    if (registryAccountName !== undefined) user.registryAccountName = registryAccountName;
    if (registryAccountNumber !== undefined) user.registryAccountNumber = registryAccountNumber;
    if (registryNotes !== undefined) user.registryNotes = registryNotes;

    const previouslyReached = user.honeymoonFundTarget > 0 && user.honeymoonFundCurrent >= user.honeymoonFundTarget;

    if (typeof honeymoonFundTarget === "number") user.honeymoonFundTarget = honeymoonFundTarget;
    if (typeof honeymoonFundCurrent === "number") user.honeymoonFundCurrent = honeymoonFundCurrent;

    const newlyReached = user.honeymoonFundTarget > 0 && user.honeymoonFundCurrent >= user.honeymoonFundTarget;

    if (!previouslyReached && newlyReached) {
      sendHoneymoonGoalReachedNotification({
        coupleEmail: user.email,
        coupleName: `${user.partner1Name} & ${user.partner2Name}`,
        targetAmount: user.honeymoonFundTarget,
        currentAmount: user.honeymoonFundCurrent,
      });
    }

    // Apply tier limitations for visual styles
    if (user.tier === "unpaid") {
      user.cardTheme = "floral";
      user.customCardBg = "";
      user.pageBgTemplate = "";
      user.galleryPhotos = [];
      user.musicUrl = "";
      user.customFontFamily = "classic";
      user.customTextColor = "#1A2E4A";
      user.couplePhotoUrl = "";
      user.coupleOverlayOpacity = 0.45;
      user.registryEnabled = false;
    } else if (user.tier === "free") {
      const allowedFreeBgs = [
        "/templates/Blush Pink Watercolor.webp",
        "/templates/Cream Floral Elegance.webp",
        "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_09 AM (1).webp",
        "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_10 AM (2).webp",
        "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_14 AM (3).webp",
        "/Free Plan Vowlink/ChatGPT Image Jun 25, 2026, 11_46_16 AM (4).webp"
      ];
      // Classic users can use floral/minimalist or the two classic background templates.
      if (cardTheme === "custom" && normalizedCustomCardBg && allowedFreeBgs.includes(normalizedCustomCardBg)) {
        user.cardTheme = "custom";
        user.customCardBg = normalizedCustomCardBg;
      } else if (cardTheme && ["floral", "minimalist"].includes(cardTheme)) {
        user.cardTheme = cardTheme;
        user.customCardBg = "";
      } else if (cardTheme === "plain") {
        user.cardTheme = "plain";
        user.customCardBg = "";
      } else {
        user.cardTheme = "floral";
        user.customCardBg = "";
      }
      user.pageBgTemplate = "";
      user.galleryPhotos = [];
      user.musicUrl = "";
      user.customFontFamily = "classic";
      if (customTextColor !== undefined) {
        user.customTextColor = customTextColor;
      } else {
        user.customTextColor = "#1A2E4A";
      }
      user.couplePhotoUrl = "";
      user.coupleOverlayOpacity = 0.45;
    } else if (user.tier === "plus") {
      const allowedPlusBgs = [
        "/templates/template_free_1.webp",
        "/templates/Blush Pink Watercolor.webp",
        "/templates/Cream Floral Elegance.webp",
        "/templates/Emerald Eucalyptus Frame.webp",
        "/templates/Royal Navy Lace Accent.webp",
        "/templates/elegant_gold_frame_with_navy_backdrop.webp",
        "/templates/Elegant purple and silver floral.webp"
      ];
      // Plus tier layout permissions
      if (cardTheme && cardTheme !== "custom" && ["floral", "minimalist", "navy", "plain"].includes(cardTheme)) {
        user.cardTheme = cardTheme;
        user.customCardBg = "";
      } else if (cardTheme === "custom" && normalizedCustomCardBg && (allowedPlusBgs.includes(normalizedCustomCardBg) || normalizedCustomCardBg.startsWith("/Free Plan Vowlink/") || normalizedCustomCardBg.startsWith("/Plus Plans Vowlink/"))) {
        user.cardTheme = "custom";
        user.customCardBg = normalizedCustomCardBg;
      } else {
        user.cardTheme = "floral"; // Fallback if custom chosen without approved template
        user.customCardBg = "";
      }
      if (normalizedPageBgTemplate !== undefined) {
        if (normalizedPageBgTemplate && allowedPlusBgs.includes(normalizedPageBgTemplate)) {
          user.pageBgTemplate = normalizedPageBgTemplate;
        } else if (normalizedPageBgTemplate === "") {
          user.pageBgTemplate = "";
        }
        // If pageBgTemplate is sent but not in allowed list, preserve existing value
      }
      if (galleryPhotos !== undefined && Array.isArray(galleryPhotos)) {
        user.galleryPhotos = galleryPhotos.slice(0, 5);
      }
      if (musicUrl !== undefined) user.musicUrl = musicUrl;
      if (customFontFamily !== undefined) user.customFontFamily = customFontFamily;
      if (customTextColor !== undefined) user.customTextColor = customTextColor;
      if (couplePhotoUrl !== undefined) user.couplePhotoUrl = couplePhotoUrl;
      if (typeof coupleOverlayOpacity === "number") user.coupleOverlayOpacity = coupleOverlayOpacity;
    } else if (user.tier === "pro") {
      // Pro tier unlocks everything
      if (cardTheme) user.cardTheme = cardTheme;
      if (galleryPhotos !== undefined && Array.isArray(galleryPhotos)) {
        user.galleryPhotos = galleryPhotos.slice(0, 15);
      }
      if (musicUrl !== undefined) user.musicUrl = musicUrl;
      if (customFontFamily !== undefined) user.customFontFamily = customFontFamily;
      if (customTextColor !== undefined) user.customTextColor = customTextColor;
      if (normalizedCustomCardBg !== undefined) user.customCardBg = normalizedCustomCardBg;
      if (couplePhotoUrl !== undefined) user.couplePhotoUrl = couplePhotoUrl;
      if (typeof coupleOverlayOpacity === "number") user.coupleOverlayOpacity = coupleOverlayOpacity;
      if (normalizedPageBgTemplate !== undefined) user.pageBgTemplate = normalizedPageBgTemplate;
    }

    // Apply fine-tuning inputs for all tiers
    if (typeof customVerticalOffset === "number") user.customVerticalOffset = customVerticalOffset;
    if (typeof customHorizontalOffset === "number") user.customHorizontalOffset = customHorizontalOffset;
    if (typeof customTextSize === "number") user.customTextSize = customTextSize;
    if (typeof customTextSizeTitle === "number") user.customTextSizeTitle = customTextSizeTitle;
    if (typeof customTextSizeSubtitle === "number") user.customTextSizeSubtitle = customTextSizeSubtitle;
    if (typeof customTextSizeCoupleNames === "number") user.customTextSizeCoupleNames = customTextSizeCoupleNames;
    if (typeof customTextSizeGreeting === "number") user.customTextSizeGreeting = customTextSizeGreeting;
    if (typeof customTextSizeMessage === "number") user.customTextSizeMessage = customTextSizeMessage;
    if (typeof customTextSizeDetails === "number") user.customTextSizeDetails = customTextSizeDetails;
    if (typeof customTextSizeReception === "number") user.customTextSizeReception = customTextSizeReception;
    if (typeof customTextSizeColors === "number") user.customTextSizeColors = customTextSizeColors;
    if (customTextColors !== undefined && typeof customTextColors === "object") {
      user.customTextColors = normalizeCustomTextColors(customTextColors);
    }
    if (customTextBoldness !== undefined && ["normal", "medium", "bold"].includes(customTextBoldness)) {
      user.customTextBoldness = customTextBoldness;
    }

    if (customTextAlign && ["left", "center", "right"].includes(customTextAlign)) {
      user.customTextAlign = customTextAlign;
    }

    if (typeof userHasCustomAlignment === "boolean") {
      user.userHasCustomAlignment = userHasCustomAlignment;
    }

    if (typeof userHasCustomTextColor === "boolean") {
      user.userHasCustomTextColor = userHasCustomTextColor;
    }

    if (typeof smartLayoutEnabled === "boolean") {
      user.smartLayoutEnabled = smartLayoutEnabled;
    }

    if (customShareMessage !== undefined) {
      user.customShareMessage = customShareMessage;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated",
      accessToken: generateAccessToken(user),
      user: userPublic(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

// ── POST /api/auth/upgrade — mock tier upgrade ─────────────────────────────────
router.post("/upgrade", protect, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Bypass upgrades are disabled in production." });
  }
  try {
    const { tier } = req.body;
    if (!["unpaid", "free", "plus", "pro"].includes(tier)) {
      return res.status(400).json({ message: "Invalid subscription tier." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.tier = tier;
    await user.save();

    res.status(200).json({
      message: `Successfully activated ${tier === "free" ? "CLASSIC" : tier.toUpperCase()} tier! `,
      accessToken: generateAccessToken(user),
      user: userPublic(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Upgrade failed", error: error.message });
  }
});

// ── POST /api/auth/make-admin-dev — Dev local admin seeding ──────────────────────
router.post("/make-admin-dev", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });
    const targetEmail = email.toLowerCase().trim();
    if (targetEmail !== "nwubachukwuemelie@gmail.com") {
      return res.status(403).json({ message: "Access denied. Only nwubachukwuemelie@gmail.com can be elevated to Super Admin." });
    }
    const user = await User.findOne({ email: targetEmail });
    if (!user) return res.status(404).json({ message: "User not found." });
    
    user.role = "admin";
    await user.save();
    res.status(200).json({ message: `${email} is now a Super Admin! `, user });
  } catch (error) {
    res.status(500).json({ message: "Seeding failed", error: error.message });
  }
});


// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    console.log("[forgot-password] Request received for email:", email);

    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    console.log("[forgot-password] User found:", !!user);

    if (!user) {
      console.log("[forgot-password] Email not in database:", email);
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    console.log("[forgot-password] Reset token saved to database");

    const clientUrl = (process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://vowlink.co").replace(/\/+$/, "");
    const resetUrl = `${clientUrl}/admin/reset-password/${token}`;
    console.log("[forgot-password] Reset URL:", resetUrl);

    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `[forgot-password] SendGrid not configured. Reset link for ${email}: ${resetUrl}`,
      );
    } else {
      try {
        console.log("[forgot-password] Calling sendResetEmail()...");
        await sendResetEmail(email, resetUrl);
        console.log("[forgot-password] Email sent successfully");
      } catch (mailError) {
        console.error(
          "[forgot-password] Failed to send reset email for",
          email,
        );
        console.error(
          "[forgot-password] Error:",
          mailError?.message || mailError,
        );
      }
    }

    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[forgot-password] Unexpected error:", error);
    res
      .status(500)
      .json({ message: "Failed to process request.", error: error.message });
  }
});

// ── POST /api/auth/reset-password/:token ─────────────────────────────────────
router.post("/reset-password/:token", resetPasswordLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Reset link is invalid or has expired." });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Reset failed.", error: error.message });
  }
});

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to change password", error: error.message });
  }
});

// ── DELETE /api/auth/delete-account ───────────────────────────────────────────
router.delete("/delete-account", protect, async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword) {
      return res.status(400).json({ message: "Please enter your password to confirm account deletion." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(confirmPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password. Account deletion canceled." });
    }

    // Cascade delete invitations and RSVPs
    const Invitation = require("../models/Invitation");
    const RSVP = require("../models/RSVP");

    const invitations = await Invitation.find({ userId: user._id });
    const invitationIds = invitations.map(i => i._id);

    // Delete related RSVPs
    await RSVP.deleteMany({ invitationId: { $in: invitationIds } });
    // Delete related Invitations
    await Invitation.deleteMany({ userId: user._id });
    // Delete User
    await User.findByIdAndDelete(user._id);

    res.status(200).json({ message: "Your VowLink account has been successfully deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
});

// ── POST /api/auth/upgrade/verify — actual Paystack verification ──────────────
router.post("/upgrade/verify", protect, async (req, res) => {
  try {
    const { reference, tier } = req.body;
    if (!reference || !tier) {
      return res.status(400).json({ message: "Reference and tier are required." });
    }

    if (!["free", "plus", "pro"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier." });
    }

    // Dev bypass for local testing
    if (reference && reference.startsWith("MOCK-")) {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ message: "Test payments are disabled in production." });
      }
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found." });
      user.tier = tier;
      await user.save();
      return res.status(200).json({
        message: `[DEV BYPASS] Successfully verified and activated ${tier === "free" ? "CLASSIC" : tier.toUpperCase()} tier! `,
        accessToken: generateAccessToken(user),
        user: userPublic(user),
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {

      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (response.data.status !== true || response.data.data.status !== "success") {
      return res.status(400).json({ message: "Payment verification failed on Paystack." });
    }

    const paystackData = response.data.data;
    const paystackAmount = paystackData.amount;
    const paystackCurrency = paystackData.currency;

    const planPricesNgn = {
      free: 30000,
      plus: 68000,
      pro: 120000,
    };
    const baseNgn = planPricesNgn[tier];
    const priceInUsd = baseNgn / 1500;

    let expectedAmount = 0;
    if (paystackCurrency === "NGN") {
      expectedAmount = baseNgn * 100;
    } else if (paystackCurrency === "USD") {
      expectedAmount = priceInUsd * 1.0 * 100;
    } else if (paystackCurrency === "GHS") {
      expectedAmount = priceInUsd * 14.5 * 100;
    } else if (paystackCurrency === "KES") {
      expectedAmount = priceInUsd * 130 * 100;
    } else if (paystackCurrency === "ZAR") {
      expectedAmount = priceInUsd * 18.5 * 100;
    } else if (paystackCurrency === "EUR") {
      expectedAmount = priceInUsd * 0.92 * 100;
    } else if (paystackCurrency === "GBP") {
      expectedAmount = priceInUsd * 0.79 * 100;
    } else if (paystackCurrency === "CAD") {
      expectedAmount = priceInUsd * 1.36 * 100;
    } else if (paystackCurrency === "AUD") {
      expectedAmount = priceInUsd * 1.5 * 100;
    }

    let isValidAmount = false;
    if (expectedAmount > 0) {
      const minAllowed = expectedAmount * 0.95;
      const maxAllowed = expectedAmount * 1.05;
      isValidAmount = paystackAmount >= minAllowed && paystackAmount <= maxAllowed;
    } else {
      isValidAmount = paystackAmount > 0;
    }

    if (!isValidAmount) {
      return res.status(400).json({ message: `Payment amount mismatch. Expected amount for ${tier.toUpperCase()}.` });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.tier = tier;
    await user.save();

    res.status(200).json({
      message: `Successfully verified and upgraded to ${tier === "free" ? "CLASSIC" : tier.toUpperCase()} tier! `,
      accessToken: generateAccessToken(user),
      user: userPublic(user),
    });
  } catch (error) {
    console.error("Paystack verification error:", error.response?.data || error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
});

// ── POST /api/auth/registry/verify — verify guest contribution ────────────────
router.post("/registry/verify", async (req, res) => {
  try {
    const { reference, coupleId, guestName, amount, message } = req.body;
    if (!reference || !coupleId || !guestName || !amount) {
      return res.status(400).json({ message: "Reference, coupleId, guestName, and amount are required." });
    }



    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (response.data.status !== true || response.data.data.status !== "success") {
      return res.status(400).json({ message: "Payment verification failed on Paystack." });
    }

    const paystackData = response.data.data;
    const paystackAmount = paystackData.amount; // in kobo
    const paystackCurrency = paystackData.currency;

    // verify that amount matches paystackAmount (with some tolerance)
    const expectedKobo = Number(amount) * 100;
    if (paystackCurrency === "NGN" && Math.abs(paystackAmount - expectedKobo) > 100) {
      return res.status(400).json({ message: "Payment amount mismatch." });
    }

    const couple = await User.findById(coupleId);
    if (!couple) return res.status(404).json({ message: "Couple not found." });

    const Gift = require("../models/Gift");
    
    // Check if reference already verified
    const existing = await Gift.findOne({ paymentReference: reference });
    if (existing) {
      return res.status(200).json({
        message: "Contribution already verified and recorded.",
        gift: existing,
        couple,
      });
    }

    const gift = await Gift.create({
      userId: coupleId,
      guestName,
      amount: Number(amount),
      message: message || "",
      paymentReference: reference,
      status: "success",
    });

    const previouslyReached = couple.honeymoonFundTarget > 0 && couple.honeymoonFundCurrent >= couple.honeymoonFundTarget;
    couple.honeymoonFundCurrent = (couple.honeymoonFundCurrent || 0) + Number(amount);
    await couple.save();

    const newlyReached = couple.honeymoonFundTarget > 0 && couple.honeymoonFundCurrent >= couple.honeymoonFundTarget;
    if (!previouslyReached && newlyReached) {
      sendHoneymoonGoalReachedNotification({
        coupleEmail: couple.email,
        coupleName: `${couple.partner1Name} & ${couple.partner2Name}`,
        targetAmount: couple.honeymoonFundTarget,
        currentAmount: couple.honeymoonFundCurrent,
      }).catch((err) => console.error("Honeymoon email notification error:", err.message));
    }

    res.status(200).json({
      message: "Contribution successfully verified and recorded! ",
      gift,
      couple,
    });
  } catch (error) {
    console.error("Registry verify error:", error.response?.data || error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
});

// ── GET /api/auth/registry/gifts — list all contributions for couple ──────────
router.get("/registry/gifts", protect, async (req, res) => {
  try {
    const Gift = require("../models/Gift");
    const gifts = await Gift.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(gifts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch gifts", error: error.message });
  }
});

// ── POST /api/auth/paystack/webhook — Paystack Webhook Listener ──────────────
router.post("/paystack/webhook", async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = req.body;
    if (event.event === "charge.success") {
      const { reference, customer, metadata } = event.data;
      const email = customer.email;
      
      const paymentType = metadata?.paymentType || (reference.startsWith("VOWLINK-VENUE") ? "venue_subscription" : "couple_upgrade");
      const targetTier = metadata?.tier;
      
      if (paymentType === "couple_upgrade" && targetTier && ["free", "plus", "pro"].includes(targetTier)) {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.tier = targetTier;
          await user.save();
          console.log(`[PAYSTACK WEBHOOK] Upgraded couple ${email} to ${targetTier}`);
        }
      } else if (paymentType === "venue_subscription" && targetTier) {
        const Venue = require("../models/Venue");
        const venue = await Venue.findOne({ ownerEmail: email.toLowerCase() });
        if (venue) {
          venue.subscriptionTier = targetTier;
          venue.isFeatured = targetTier === "featured";
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          venue.subscriptionExpiry = expiry;
          await venue.save();
          console.log(`[PAYSTACK WEBHOOK] Upgraded venue ${venue.name} to ${targetTier}`);
        }
      } else if (paymentType === "registry_gift") {
        const Gift = require("../models/Gift");
        const existing = await Gift.findOne({ paymentReference: reference });
        if (!existing) {
          const coupleId = metadata?.coupleId;
          const guestName = metadata?.guestName || "Anonymous Guest";
          const amount = event.data.amount / 100; // kobo to NGN
          const message = metadata?.message || "";
          
          if (coupleId) {
            const couple = await User.findById(coupleId);
            if (couple) {
              await Gift.create({
                userId: coupleId,
                guestName,
                amount,
                message,
                paymentReference: reference,
                status: "success",
              });
              
              const previouslyReached = couple.honeymoonFundTarget > 0 && couple.honeymoonFundCurrent >= couple.honeymoonFundTarget;
              couple.honeymoonFundCurrent = (couple.honeymoonFundCurrent || 0) + amount;
              await couple.save();
              
              const newlyReached = couple.honeymoonFundTarget > 0 && couple.honeymoonFundCurrent >= couple.honeymoonFundTarget;
              if (!previouslyReached && newlyReached) {
                const { sendHoneymoonGoalReachedNotification } = require("../utils/email");
                sendHoneymoonGoalReachedNotification({
                  coupleEmail: couple.email,
                  coupleName: `${couple.partner1Name} & ${couple.partner2Name}`,
                  targetAmount: couple.honeymoonFundTarget,
                  currentAmount: couple.honeymoonFundCurrent,
                }).catch((err) => console.error("Honeymoon target notification error:", err.message));
              }
              console.log(`[PAYSTACK WEBHOOK] Recorded gift of ₦${amount} to couple ${couple.email}`);
            }
          }
        }
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Paystack webhook error:", error.message);
    res.status(500).json({ message: "Webhook handler failed", error: error.message });
  }
});

// ── DELETE /api/auth/gallery-photo (Delete a gallery photo from Cloudinary + DB) ──
router.delete("/gallery-photo", protect, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ message: "No photoUrl provided." });
    }

    // Extract the public_id from the Cloudinary URL
    // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123/vowlink/couples/abc123.jpg
    // public_id = "vowlink/couples/abc123"
    const urlParts = photoUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      // Skip the version segment (v12345) if present
      let afterUpload = urlParts.slice(uploadIndex + 1);
      if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) {
        afterUpload = afterUpload.slice(1);
      }
      const publicIdWithExt = afterUpload.join("/");
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // strip extension
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.warn("Cloudinary destroy warning:", cloudErr.message);
        // Non-fatal — still remove from DB even if Cloudinary delete fails
      }
    }

    // Remove the URL from the user's galleryPhotos array in the DB
    const user = await User.findById(req.user.id);
    if (user) {
      user.galleryPhotos = (user.galleryPhotos || []).filter((p) => p !== photoUrl);
      await user.save();
    }

    res.status(200).json({ message: "Photo deleted successfully." });
  } catch (error) {
    console.error("Gallery photo delete error:", error);
    res.status(500).json({ message: "Failed to delete photo.", error: error.message });
  }
});

// ── POST /api/auth/upload (Pro/Plus/Free: Cloudinary upload helper) ─────────
router.post("/upload", protect, async (req, res) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ message: "No file provided for upload." });
    }

    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: "vowlink/couples",
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({ message: "Upload to Cloudinary failed", error: error.message });
  }
});

module.exports = router;
