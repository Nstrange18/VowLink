const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ── Token helpers ─────────────────────────────────────────────────────────────
const userPayload = (user) => ({
  id: user._id,
  partner1Name: user.partner1Name,
  partner2Name: user.partner2Name,
  email: user.email,
  weddingDate: user.weddingDate,
  rsvpDeadline: user.rsvpDeadline,
  venue: user.venue,
});

const generateAccessToken = (user) =>
  jwt.sign(userPayload(user), process.env.JWT_SECRET, { expiresIn: "1h" });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

const userPublic = (user) => ({
  id: user._id,
  partner1Name: user.partner1Name,
  partner2Name: user.partner2Name,
  email: user.email,
  weddingDate: user.weddingDate,
  rsvpDeadline: user.rsvpDeadline,
  venue: user.venue,
});

// ── Email helper ──────────────────────────────────────────────────────────────
const sendResetEmail = async (email, resetUrl) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("SMTP not configured – set EMAIL_USER and EMAIL_PASS in environment variables.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: `"VowLink" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your VowLink password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
        <h2 style="color:#1A2E4A;font-size:22px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#444;line-height:1.6">Click the button below to reset your VowLink password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#D8B76A;color:#1A2E4A;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:bold;letter-spacing:1px;margin:20px 0;font-size:14px">
          Reset Password
        </a>
        <p style="color:#999;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#ccc;font-size:11px;word-break:break-all">${resetUrl}</p>
      </div>
    `,
  });
};

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { partner1Name, partner2Name, email, password, weddingDate, rsvpDeadline, venue } = req.body;
    if (!partner1Name || !partner2Name || !email || !password)
      return res.status(400).json({ message: "All fields are required." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "An account with this email already exists." });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      partner1Name, partner2Name, email,
      password: hashed,
      weddingDate: weddingDate || null,
      rsvpDeadline: rsvpDeadline || null,
      venue: venue || "",
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
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

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
    return res.status(401).json({ message: "Invalid or expired refresh token. Please log in again." });
  }
});

// ── PUT /api/auth/me — update profile ────────────────────────────────────────
router.put("/me", protect, async (req, res) => {
  try {
    const { partner1Name, partner2Name, weddingDate, rsvpDeadline, venue } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { partner1Name, partner2Name, weddingDate, rsvpDeadline, venue },
      { new: true }
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
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";
    const resetUrl = `${clientUrl}/admin/reset-password/${token}`;

    await sendResetEmail(email, resetUrl);

    res.status(200).json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    res.status(500).json({ message: "Failed to process request.", error: error.message });
  }
});

// ── POST /api/auth/reset-password/:token ─────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: "Reset link is invalid or has expired." });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Reset failed.", error: error.message });
  }
});

module.exports = router;
