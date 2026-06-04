const express = require("express");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const createSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

// ─── PUBLIC: Get invitation by slug (for guests) ────────────────────────────
router.get("/slug/:slug", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      slug: req.params.slug,
    }).populate(
      "userId",
      "partner1Name partner2Name weddingDate weddingTime rsvpDeadline venue receptionLocation dressCode weddingColors plusOnePolicy kidsAllowed cardTheme customCardBg pageBgTemplate customTextColor customFontFamily customVerticalOffset customTextSize couplePhotoUrl coupleOverlayOpacity musicUrl galleryPhotos tier",
    );

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    res.status(200).json(invitation);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch invitation", error: error.message });
  }
});

// ─── PROTECTED: All routes below require login ───────────────────────────────

// Create invitation
router.post("/", protect, async (req, res) => {
  try {
    const { guestName, greeting, customMessage, allowedGuests, category } =
      req.body;

    if (!guestName || !greeting || !customMessage) {
      return res.status(400).json({
        message: "Guest name, greeting, and custom message are required.",
      });
    }

    if (customMessage.trim().length > 70) {
      return res.status(400).json({
        message: "Personal message cannot be more than 70 characters.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Limit check based on tier
    const count = await Invitation.countDocuments({ userId: req.user.id });
    if (user.tier === "free" && count >= 10) {
      return res.status(403).json({
        message: "You have reached the maximum limit of 10 invitations for the Free plan. Please upgrade to create more.",
      });
    }
    if (user.tier === "plus" && count >= 100) {
      return res.status(403).json({
        message: "You have reached the maximum limit of 100 invitations for the Plus plan. Please upgrade to Pro for unlimited invitations.",
      });
    }

    let slug = createSlug(guestName);
    const existing = await Invitation.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const invitation = await Invitation.create({
      userId: req.user.id,
      guestName,
      slug,
      greeting,
      customMessage,
      allowedGuests,
      category,
    });

    res.status(201).json({
      message: "Invitation created successfully",
      data: invitation,
      link: `/invite/${invitation.slug}`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create invitation", error: error.message });
  }
});

// Bulk Create invitations (Plus & Pro)
router.post("/bulk", protect, async (req, res) => {
  try {
    const { guests, defaultGreeting, defaultCustomMessage } = req.body;
    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ message: "An array of guests is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.tier === "free") {
      return res.status(403).json({
        message: "Bulk invitation creation is a Plus and Pro plan feature. Please upgrade.",
      });
    }

    const currentCount = await Invitation.countDocuments({ userId: req.user.id });
    if (user.tier === "plus" && currentCount + guests.length > 100) {
      return res.status(403).json({
        message: `Creating ${guests.length} invitations will exceed your Plus plan limit of 100. Current total: ${currentCount}.`,
      });
    }

    const createdInvitations = [];
    const now = Date.now();

    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const guestName = g.guestName?.trim();
      if (!guestName) continue;

      const greeting = g.greeting?.trim() || defaultGreeting?.replace("{name}", guestName) || `Dear ${guestName},`;
      let customMessage = g.customMessage?.trim() || defaultCustomMessage || "We request the pleasure of your company on our wedding day.";
      if (customMessage.length > 70) {
        customMessage = customMessage.substring(0, 70);
      }
      const allowedGuests = Number(g.allowedGuests) || 1;
      const category = g.category?.trim() || "Guest";

      let slug = createSlug(guestName);
      // To prevent bulk collisions, append unique timestamps for duplicates
      const existing = await Invitation.findOne({ slug });
      if (existing || createdInvitations.some(ci => ci.slug === slug)) {
        slug = `${slug}-${now}-${i}`;
      }

      createdInvitations.push({
        userId: req.user.id,
        guestName,
        slug,
        greeting,
        customMessage,
        allowedGuests,
        category,
      });
    }

    if (createdInvitations.length === 0) {
      return res.status(400).json({ message: "No valid guests to import." });
    }

    const result = await Invitation.insertMany(createdInvitations);

    res.status(201).json({
      message: `Successfully imported ${result.length} invitations! 💌`,
      count: result.length,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: "Bulk import failed", error: error.message });
  }
});

// Get all invitations for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const invitations = await Invitation.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json(invitations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch invitations", error: error.message });
  }
});

// Update invitation (owner only)
router.put("/:id", protect, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const { customMessage } = req.body;
    if (customMessage && customMessage.trim().length > 70) {
      return res.status(400).json({
        message: "Personal message cannot be more than 70 characters.",
      });
    }

    const updated = await Invitation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res
      .status(200)
      .json({ message: "Invitation updated successfully", data: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update invitation", error: error.message });
  }
});

// Delete invitation (owner only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const invitation = await Invitation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    res.status(200).json({ message: "Invitation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete invitation", error: error.message });
  }
});

module.exports = router;
