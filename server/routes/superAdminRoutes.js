const express = require("express");
const User = require("../models/User");
const Inquiry = require("../models/Inquiry");
const Invitation = require("../models/Invitation");
const RSVP = require("../models/RSVP");
const { protect } = require("../middleware/auth");

const router = express.Router();

const protectAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === "admin" && user.email?.toLowerCase() === "nwubachukwuemelie@gmail.com") {
      next();
    } else {
      res.status(403).json({ message: "Access denied. Super Admins only." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during admin verification", error: error.message });
  }
};

router.use(protect, protectAdmin);

router.get("/couples", async (req, res) => {
  try {
    const couples = await User.find({ role: { $ne: "admin" } })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });
    res.status(200).json(couples);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch couples", error: error.message });
  }
});

router.put("/couples/tier/:id", async (req, res) => {
  try {
    const { tier } = req.body;
    if (!["unpaid", "free", "plus", "pro"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Couple account not found." });

    user.tier = tier;
    await user.save();
    res.status(200).json({
      message: `Manually set couple tier to ${tier === "free" ? "CLASSIC" : tier.toUpperCase()}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update couple tier", error: error.message });
  }
});

router.delete("/couples/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Couple account not found." });

    await Inquiry.deleteMany({ user: userId });

    const invitations = await Invitation.find({ userId });
    const invitationIds = invitations.map((inv) => inv._id);

    await RSVP.deleteMany({ invitationId: { $in: invitationIds } });
    await Invitation.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Couple account, invitations, RSVPs, and logs successfully deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete couple account", error: error.message });
  }
});

module.exports = router;
