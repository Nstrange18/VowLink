const express = require("express");
const RSVP = require("../models/RSVP");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const { sendRsvpCoupleAlert, sendRsvpGuestConfirmation, sendRsvpLimitReachedAlert } = require("../utils/email");

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
    const { invitationId, guestName, guestEmail, phone, attending, mealPreference, message } = req.body;

    if (!invitationId || !guestName || !phone || !attending) {
      return res.status(400).json({
        message: "Invitation ID, guest name, phone, and attendance are required.",
      });
    }

    const invitation = await Invitation.findById(invitationId).populate("userId", "plusOnePolicy email partner1Name partner2Name weddingDate venue tier");
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const couple = invitation.userId;
    let currentRsvpCount = 0;
    if (couple) {
      const coupleInvitations = await Invitation.find({ userId: couple._id }).select("_id");
      const invitationIds = coupleInvitations.map((i) => i._id);
      currentRsvpCount = await RSVP.countDocuments({ invitationId: { $in: invitationIds } });

      if (couple.tier === "free" && currentRsvpCount >= 20) {
        return res.status(403).json({
          message: "This wedding invitation has reached the maximum limit of 20 RSVP responses for the Free plan. To accept more RSVPs, the couple needs to upgrade their plan.",
        });
      }
      if (couple.tier === "plus" && currentRsvpCount >= 100) {
        return res.status(403).json({
          message: "This wedding invitation has reached the maximum limit of 100 RSVP responses for the Plus plan. To accept more RSVPs, the couple needs to upgrade their plan.",
        });
      }
      if (couple.tier === "pro" && currentRsvpCount >= 500) {
        return res.status(403).json({
          message: "This wedding invitation has reached the maximum limit of 500 RSVP responses.",
        });
      }
    }

    const plusOnePolicy = invitation.userId?.plusOnePolicy || "invitation_only";
    const numberOfGuests =
      attending === "Yes" ? getInvitedGuestCount(invitation, plusOnePolicy) : 0;

    const rsvp = await RSVP.create({
      invitationId,
      guestName,
      guestEmail: guestEmail || "",
      phone,
      attending,
      numberOfGuests,
      mealPreference: mealPreference || "No Preference",
      message,
    });

    invitation.hasRSVPed = true;
    await invitation.save();

    // ── Fire emails async (don't block response) ──────────────────────────
    if (couple) {
      const coupleName = `${couple.partner1Name} & ${couple.partner2Name}`;

      // Alert the couple
      sendRsvpCoupleAlert({
        coupleEmail: couple.email,
        coupleName,
        guestName,
        attending,
        guestCount: numberOfGuests,
        weddingDate: couple.weddingDate,
      }).catch(() => {});

      // Confirm to guest if they provided an email
      if (guestEmail) {
        sendRsvpGuestConfirmation({
          guestEmail,
          guestName,
          coupleName,
          attending,
          weddingDate: couple.weddingDate,
          venue: couple.venue,
        }).catch(() => {});
      }

      // Check if RSVP limit is reached with this submission
      const limit = couple.tier === "free" ? 20 : couple.tier === "plus" ? 100 : 500;
      if ((couple.tier === "free" || couple.tier === "plus") && currentRsvpCount + 1 === limit) {
        sendRsvpLimitReachedAlert({
          coupleEmail: couple.email,
          coupleName,
          tier: couple.tier,
          limit
        }).catch(() => {});
      }
    }

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
      .populate("invitationId", "guestName slug category allowedGuests senderGroup")
      .sort({ createdAt: -1 });

    res.status(200).json(rsvps);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch RSVPs", error: error.message });
  }
});

module.exports = router;
