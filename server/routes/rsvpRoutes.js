const express = require("express");
const RSVP = require("../models/RSVP");
const Invitation = require("../models/Invitation");
const { protect } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// ── Rate limiter for RSVP submissions ────────────────────────────────────────
// Protects the RSVP form from spam/bot submissions.

const rsvpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 RSVP attempts per IP every 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many RSVP attempts. Please wait 10 minutes and try again.",
  },
});

const getInvitedGuestCount = (invitation, plusOnePolicy) => {
  const base = invitation.allowedGuests || 1;
  if (plusOnePolicy === "plus_one_allowed") {
    return Math.min(base + 1, 10);
  }
  return base;
};

// PUBLIC: Submit RSVP (guests don't need to be logged in)
router.post("/", rsvpLimiter, async (req, res) => {
  try {
    const { invitationId, guestName, phone, attending, mealPreference, message } = req.body;

    if (!invitationId || !guestName || !phone || !attending) {
      return res.status(400).json({
        message: "Invitation ID, guest name, phone, and attendance are required.",
      });
    }

    const invitation = await Invitation.findById(invitationId).populate("userId", "plusOnePolicy");
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const plusOnePolicy = invitation.userId?.plusOnePolicy || "invitation_only";
    const numberOfGuests =
      attending === "Yes" ? getInvitedGuestCount(invitation, plusOnePolicy) : 0;

    const rsvp = await RSVP.create({
      invitationId,
      guestName,
      phone,
      attending,
      numberOfGuests,
      mealPreference: mealPreference || "No Preference",
      message,
    });

    invitation.hasRSVPed = true;
    await invitation.save();

    res.status(201).json({ message: "RSVP submitted successfully", data: rsvp });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit RSVP", error: error.message });
  }
});

// PROTECTED: Get RSVPs for the logged-in user's invitations only
router.get("/", protect, async (req, res) => {
  try {
    // First get all invitation IDs belonging to this user
    const userInvitations = await Invitation.find({ userId: req.user.id }).select("_id");
    const invitationIds = userInvitations.map((i) => i._id);

    const rsvps = await RSVP.find({ invitationId: { $in: invitationIds } })
      .populate("invitationId", "guestName slug category allowedGuests")
      .sort({ createdAt: -1 });

    res.status(200).json(rsvps);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch RSVPs", error: error.message });
  }
});

module.exports = router;