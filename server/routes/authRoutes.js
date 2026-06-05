const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const sgMail = require("@sendgrid/mail");
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
  receptionLocation: user.receptionLocation || "",
  weddingColors: user.weddingColors || [],
  dressCode: user.dressCode || "",
  plusOnePolicy: user.plusOnePolicy || "invitation_only",
  kidsAllowed: typeof user.kidsAllowed === "boolean" ? user.kidsAllowed : true,
  tier: user.tier || "free",
  cardTheme: user.cardTheme || "floral",
  customTextColor: user.customTextColor || "#1A2E4A",
  customFontFamily: user.customFontFamily || "classic",
  customVerticalOffset: typeof user.customVerticalOffset === "number" ? user.customVerticalOffset : 0,
  customTextSize: typeof user.customTextSize === "number" ? user.customTextSize : 1.0,
  coupleOverlayOpacity: typeof user.coupleOverlayOpacity === "number" ? user.coupleOverlayOpacity : 0.45,
  musicUrl: user.musicUrl || "",
  shortlistedVenues: user.shortlistedVenues || [],
  role: user.role || "user",
  customTextAlign: user.customTextAlign || "center",
  customHorizontalOffset: typeof user.customHorizontalOffset === "number" ? user.customHorizontalOffset : 0,
  smartLayoutEnabled: typeof user.smartLayoutEnabled === "boolean" ? user.smartLayoutEnabled : true,
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
  receptionLocation: user.receptionLocation || "",
  weddingColors: user.weddingColors || [],
  dressCode: user.dressCode || "",
  plusOnePolicy: user.plusOnePolicy || "invitation_only",
  kidsAllowed: typeof user.kidsAllowed === "boolean" ? user.kidsAllowed : true,
  tier: user.tier || "free",
  // NOTE: galleryPhotos, customCardBg, couplePhotoUrl are intentionally excluded here.
  // They can be large base64 strings (MBs) that crash localStorage.setItem() with QuotaExceededError.
  // These are fetched separately by the settings page via GET /api/auth/me.
  cardTheme: user.cardTheme || "floral",
  customTextColor: user.customTextColor || "#1A2E4A",
  customFontFamily: user.customFontFamily || "classic",
  customVerticalOffset: typeof user.customVerticalOffset === "number" ? user.customVerticalOffset : 0,
  customTextSize: typeof user.customTextSize === "number" ? user.customTextSize : 1.0,
  coupleOverlayOpacity: typeof user.coupleOverlayOpacity === "number" ? user.coupleOverlayOpacity : 0.45,
  musicUrl: user.musicUrl || "",
  shortlistedVenues: user.shortlistedVenues || [],
  pageBgTemplate: user.pageBgTemplate || "",
  role: user.role || "user",
  customTextAlign: user.customTextAlign || "center",
  customHorizontalOffset: typeof user.customHorizontalOffset === "number" ? user.customHorizontalOffset : 0,
  smartLayoutEnabled: typeof user.smartLayoutEnabled === "boolean" ? user.smartLayoutEnabled : true,
});

// ── Email helper ──────────────────────────────────────────────────────────────
const sendResetEmail = async (email, resetUrl) => {
  console.log("📧 [sendResetEmail] Attempting to send reset email to:", email);

  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ [sendResetEmail] SendGrid API key missing");
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

    console.log("✅ [sendResetEmail] Email sent successfully to:", email);
  } catch (error) {
    console.error("❌ [sendResetEmail] Failed to send email");
    console.error("❌ [sendResetEmail] Error:", error.message);
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
    const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
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
      receptionLocation,
      weddingColors,
      dressCode,
      plusOnePolicy,
      kidsAllowed,
      cardTheme,
      customCardBg,
      pageBgTemplate,
      customTextColor,
      customFontFamily,
      customVerticalOffset,
      customTextSize,
      musicUrl,
      galleryPhotos,
      couplePhotoUrl,
      coupleOverlayOpacity,
      customTextAlign,
      customHorizontalOffset,
      smartLayoutEnabled,
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update basic settings
    user.partner1Name = partner1Name;
    user.partner2Name = partner2Name;
    user.weddingDate = weddingDate || null;
    user.weddingTime = weddingTime || "18:00";
    user.rsvpDeadline = rsvpDeadline || null;
    user.venue = venue || "";
    user.receptionLocation = receptionLocation || "";
    user.weddingColors = Array.isArray(weddingColors) ? weddingColors : [];
    user.dressCode = dressCode || "";
    user.plusOnePolicy = plusOnePolicy === "plus_one_allowed" ? "plus_one_allowed" : "invitation_only";
    user.kidsAllowed = typeof kidsAllowed === "boolean" ? kidsAllowed : true;

    // Plan-based validation for premium customizations
    if (user.tier === "free") {
      const allowedFreeBgs = [
        "/templates/template_free_1.png",
        "/templates/template_free_2.png",
        "/templates/template_free_3.png"
      ];
      if (cardTheme === "custom" && allowedFreeBgs.includes(customCardBg)) {
        user.cardTheme = "custom";
        user.customCardBg = customCardBg;
      } else {
        user.cardTheme = "floral"; // Free tier locked to floral or free templates
        user.customCardBg = "";
      }
      if (pageBgTemplate && allowedFreeBgs.includes(pageBgTemplate)) {
        user.pageBgTemplate = pageBgTemplate;
      } else {
        user.pageBgTemplate = "";
      }
      user.galleryPhotos = [];   // Free tier locked to 0 photos
      user.musicUrl = "";        // Free tier locked to silent
      user.customFontFamily = "classic";
      user.customTextColor = "#1A2E4A";
      user.customVerticalOffset = 0;
      user.customTextSize = 1.0;
      user.customHorizontalOffset = 0;
      user.couplePhotoUrl = "";
      user.coupleOverlayOpacity = 0.45;
    } else if (user.tier === "plus") {
      // Plus tier unlocks all themes except custom (unless a free/plus pre-made template is used)
      const allowedPlusBgs = [
        "/templates/template_free_1.png",
        "/templates/template_free_2.png",
        "/templates/template_free_3.png",
        "/templates/template_plus_1.png",
        "/templates/template_plus_2.png",
        "/templates/template_plus_3.png"
      ];
      if (cardTheme === "custom" && allowedPlusBgs.includes(customCardBg)) {
        user.cardTheme = "custom";
        user.customCardBg = customCardBg;
      } else if (cardTheme && cardTheme !== "custom") {
        user.cardTheme = cardTheme;
        user.customCardBg = "";
      } else {
        user.cardTheme = "floral"; // Fallback if custom chosen without approved template
        user.customCardBg = "";
      }
      if (pageBgTemplate && allowedPlusBgs.includes(pageBgTemplate)) {
        user.pageBgTemplate = pageBgTemplate;
      } else {
        user.pageBgTemplate = "";
      }
      if (Array.isArray(galleryPhotos)) {
        user.galleryPhotos = galleryPhotos.slice(0, 3);
      }
      if (musicUrl !== undefined) user.musicUrl = musicUrl;
      if (customFontFamily !== undefined) user.customFontFamily = customFontFamily;
      if (customTextColor !== undefined) user.customTextColor = customTextColor;
      if (couplePhotoUrl !== undefined) user.couplePhotoUrl = couplePhotoUrl;
      if (typeof coupleOverlayOpacity === "number") user.coupleOverlayOpacity = coupleOverlayOpacity;
      
      // Pro-only manual offsets are cleared/locked for Plus
      user.customVerticalOffset = 0;
      user.customTextSize = 1.0;
      user.customHorizontalOffset = 0;
    } else if (user.tier === "pro") {
      // Pro tier unlocks everything
      if (cardTheme) user.cardTheme = cardTheme;
      if (Array.isArray(galleryPhotos)) {
        user.galleryPhotos = galleryPhotos.slice(0, 6);
      }
      if (musicUrl !== undefined) user.musicUrl = musicUrl;
      if (customFontFamily !== undefined) user.customFontFamily = customFontFamily;
      if (customTextColor !== undefined) user.customTextColor = customTextColor;
      if (customCardBg !== undefined) user.customCardBg = customCardBg;
      if (typeof customVerticalOffset === "number") user.customVerticalOffset = customVerticalOffset;
      if (typeof customHorizontalOffset === "number") user.customHorizontalOffset = customHorizontalOffset;
      if (typeof customTextSize === "number") user.customTextSize = customTextSize;
      if (couplePhotoUrl !== undefined) user.couplePhotoUrl = couplePhotoUrl;
      if (typeof coupleOverlayOpacity === "number") user.coupleOverlayOpacity = coupleOverlayOpacity;
      if (pageBgTemplate !== undefined) user.pageBgTemplate = pageBgTemplate;
    }

    if (customTextAlign && ["left", "center", "right"].includes(customTextAlign)) {
      user.customTextAlign = customTextAlign;
    }

    if (typeof smartLayoutEnabled === "boolean") {
      user.smartLayoutEnabled = smartLayoutEnabled;
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
  try {
    const { tier } = req.body;
    if (!["free", "plus", "pro"].includes(tier)) {
      return res.status(400).json({ message: "Invalid subscription tier." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.tier = tier;
    await user.save();

    res.status(200).json({
      message: `Successfully upgraded to ${tier.toUpperCase()} tier! 🚀`,
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
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found." });
    
    user.role = "admin";
    await user.save();
    res.status(200).json({ message: `${email} is now a Super Admin! ✓`, user });
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
    console.log("📬 [forgot-password] Request received for email:", email);

    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    console.log("🔍 [forgot-password] User found:", !!user);

    if (!user) {
      console.log("⚠️ [forgot-password] Email not in database:", email);
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    console.log("💾 [forgot-password] Reset token saved to database");

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/admin/reset-password/${token}`;
    console.log("🔗 [forgot-password] Reset URL:", resetUrl);

    if (!process.env.SENDGRID_API_KEY) {
      console.log(
        `⚠️ [forgot-password] SendGrid not configured. Reset link for ${email}: ${resetUrl}`,
      );
    } else {
      try {
        console.log("📧 [forgot-password] Calling sendResetEmail()...");
        await sendResetEmail(email, resetUrl);
        console.log("✅ [forgot-password] Email sent successfully");
      } catch (mailError) {
        console.error(
          "❌ [forgot-password] Failed to send reset email for",
          email,
        );
        console.error(
          "❌ [forgot-password] Error:",
          mailError?.message || mailError,
        );
      }
    }

    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("❌ [forgot-password] Unexpected error:", error);
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

    res.status(200).json({ message: "Password changed successfully! ✓" });
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
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found." });
      user.tier = tier;
      await user.save();
      return res.status(200).json({
        message: `[DEV BYPASS] Successfully verified and upgraded to ${tier.toUpperCase()} tier! 🚀`,
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

    const baseNgn = tier === "plus" ? 2000 : 5000;
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
      message: `Successfully verified and upgraded to ${tier.toUpperCase()} tier! 🚀`,
      accessToken: generateAccessToken(user),
      user: userPublic(user),
    });
  } catch (error) {
    console.error("Paystack verification error:", error.response?.data || error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
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
      
      if (paymentType === "couple_upgrade" && targetTier) {
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
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Paystack webhook error:", error.message);
    res.status(500).json({ message: "Webhook handler failed", error: error.message });
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
    console.error("❌ Cloudinary upload error:", error);
    res.status(500).json({ message: "Upload to Cloudinary failed", error: error.message });
  }
});

module.exports = router;
