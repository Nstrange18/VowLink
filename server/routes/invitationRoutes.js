const express = require("express");
const Invitation = require("../models/Invitation");
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
      "partner1Name partner2Name weddingDate weddingTime rsvpDeadline venue receptionLocation dressCode weddingColors plusOnePolicy kidsAllowed",
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
