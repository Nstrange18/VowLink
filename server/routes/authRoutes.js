const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const sgMail = require("@sendgrid/mail");

const router = express.Router();

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
  weddingColors: user.weddingColors || [],
  dressCode: user.dressCode || "",
  plusOnePolicy: user.plusOnePolicy || "invitation_only",
  kidsAllowed: typeof user.kidsAllowed === "boolean" ? user.kidsAllowed : true,
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
  weddingColors: user.weddingColors || [],
  dressCode: user.dressCode || "",
  plusOnePolicy: user.plusOnePolicy || "invitation_only",
  kidsAllowed: typeof user.kidsAllowed === "boolean" ? user.kidsAllowed : true,
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
router.post("/signup", async (req, res) => {
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
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
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
      weddingColors,
      dressCode,
      plusOnePolicy,
      kidsAllowed,
    } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        partner1Name,
        partner2Name,
        weddingDate,
        weddingTime,
        rsvpDeadline,
        venue,
        weddingColors: Array.isArray(weddingColors) ? weddingColors : [],
        dressCode: dressCode || "",
        plusOnePolicy:
          plusOnePolicy === "plus_one_allowed"
            ? "plus_one_allowed"
            : "invitation_only",
        kidsAllowed: typeof kidsAllowed === "boolean" ? kidsAllowed : true,
      },
      { new: true },
    );
    res.status(200).json({
      message: "Profile updated",
      accessToken: generateAccessToken(user),
      user: userPublic(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
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
router.post("/reset-password/:token", async (req, res) => {
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

module.exports = router;
