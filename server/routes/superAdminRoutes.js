const express = require("express");
const User = require("../models/User");
const Venue = require("../models/Venue");
const Inquiry = require("../models/Inquiry");
const Invitation = require("../models/Invitation");
const RSVP = require("../models/RSVP");
const { protect } = require("../middleware/auth");

const router = express.Router();

const appendVenueActivity = (venue, entry) => {
  const currentLog = Array.isArray(venue.activityLog) ? venue.activityLog : [];
  venue.activityLog = [
    {
      type: entry.type || "listing",
      title: entry.title,
      message: entry.message || "",
      actorRole: entry.actorRole || "admin",
      createdAt: new Date(),
    },
    ...currentLog,
  ].slice(0, 25);
};

const verificationStatusLabels = {
  not_submitted: "Verification has not been submitted.",
  pending_review: "Verification is still waiting for review.",
  verified: "Safety checks were approved.",
  changes_requested: "VowLink requested clearer proof.",
  rejected: "Safety proof was rejected.",
};

// protectAdmin: verify logged in user exists and has role "admin"
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

// All routes here are protected by both standard protect and protectAdmin
router.use(protect, protectAdmin);

// ── VENUES ENDPOINTS ─────────────────────────────────────────────────────────

// GET /api/super-admin/venues — get all venues
router.get("/venues", async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch venues", error: error.message });
  }
});

// POST /api/super-admin/venues/status/:id — update venue approval / active status
router.post("/venues/status/:id", async (req, res) => {
  try {
    const { status, reason = "" } = req.body; // "approved" | "rejected" | "suspended" | "active"
    if (!["approved", "rejected", "suspended", "active"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const venue = await Venue.findById(req.id || req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found." });

    if (status === "approved") {
      venue.isApproved = true;
      venue.isActive = true;
      venue.approvedAt = venue.approvedAt || new Date();
      venue.reviewReason = "";
      appendVenueActivity(venue, {
        type: "visibility",
        title: "Listing approved",
        message: "Your venue can be shown to couples once the profile checklist is complete.",
      });
    } else if (status === "rejected") {
      venue.isApproved = false;
      venue.isActive = false;
      venue.reviewReason = reason || "VowLink could not approve this listing yet.";
      appendVenueActivity(venue, {
        type: "visibility",
        title: "Listing needs changes",
        message: venue.reviewReason,
      });
    } else if (status === "suspended") {
      venue.isActive = false;
      venue.reviewReason = reason || "This listing is paused from public view.";
      appendVenueActivity(venue, {
        type: "visibility",
        title: "Listing paused",
        message: venue.reviewReason,
      });
    } else if (status === "active") {
      venue.isActive = true;
      venue.reviewReason = "";
      appendVenueActivity(venue, {
        type: "visibility",
        title: "Listing reactivated",
        message: "Your venue is eligible to appear to couples again.",
      });
    }

    await venue.save();
    res.status(200).json({ message: `Venue status set to ${status} successfully.`, venue });
  } catch (error) {
    res.status(500).json({ message: "Failed to update venue status", error: error.message });
  }
});

// POST /api/super-admin/venues/featured/:id — manually grant/revoke featured placement
router.post("/venues/featured/:id", async (req, res) => {
  try {
    const venue = await Venue.findById(req.id || req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found." });

    venue.isFeatured = !venue.isFeatured;
    appendVenueActivity(venue, {
      type: "placement",
      title: venue.isFeatured ? "Featured placement added" : "Featured placement removed",
      message: venue.isFeatured
        ? "VowLink added featured placement to this venue."
        : "VowLink removed featured placement from this venue.",
    });
    await venue.save();
    res.status(200).json({
      message: venue.isFeatured
        ? "Featured placement manually granted."
        : "Featured placement manually revoked.",
      venue,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle featured status", error: error.message });
  }
});

// DELETE /api/super-admin/venues/:id — delete venue listing
router.delete("/venues/:id", async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.id || req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found." });

    // Also delete any inquiries associated with this venue
    await Inquiry.deleteMany({ venue: venue._id });

    res.status(200).json({ message: "Venue listing and associated inquiries successfully deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete venue listing", error: error.message });
  }
});

// PUT /api/super-admin/venues/verify/:id — update verification checklist and trust score
router.put("/venues/verify/:id", async (req, res) => {
  try {
    const {
      safetyFireExits,
      safetyCctv,
      safetySecurity,
      safetyStructural,
      safetyInsurance,
      trustScore,
      verificationStatus,
      verificationNotes,
    } = req.body;

    const venue = await Venue.findById(req.params.id);
    if (!venue) return res.status(404).json({ message: "Venue not found." });

    const validVerificationStatuses = ["pending_review", "verified", "changes_requested", "rejected", "not_submitted"];
    if (verificationStatus && !validVerificationStatuses.includes(verificationStatus)) {
      return res.status(400).json({ message: "Invalid verification status." });
    }

    if (safetyFireExits !== undefined) venue.safetyFireExits = safetyFireExits;
    if (safetyCctv !== undefined) venue.safetyCctv = safetyCctv;
    if (safetySecurity !== undefined) venue.safetySecurity = safetySecurity;
    if (safetyStructural !== undefined) venue.safetyStructural = safetyStructural;
    if (safetyInsurance !== undefined) venue.safetyInsurance = safetyInsurance;
    if (trustScore !== undefined) venue.trustScore = trustScore;
    if (verificationStatus !== undefined) {
      venue.verificationStatus = verificationStatus;
      venue.verificationReviewedAt = ["verified", "changes_requested", "rejected"].includes(verificationStatus)
        ? new Date()
        : undefined;
    } else {
      venue.verificationStatus = "verified";
      venue.verificationReviewedAt = new Date();
    }
    if (verificationNotes !== undefined) venue.verificationNotes = verificationNotes;
    if (["changes_requested", "rejected"].includes(venue.verificationStatus)) {
      venue.reviewReason = verificationNotes || "VowLink needs clearer proof before approving these checks.";
    } else if (venue.verificationStatus === "verified") {
      venue.reviewReason = "";
    }
    appendVenueActivity(venue, {
      type: "verification",
      title:
        venue.verificationStatus === "verified"
          ? "Safety checks approved"
          : venue.verificationStatus === "changes_requested"
          ? "Changes requested"
          : venue.verificationStatus === "rejected"
          ? "Safety proof rejected"
          : "Verification review updated",
      message: verificationNotes || verificationStatusLabels[venue.verificationStatus] || "VowLink updated the verification review.",
    });

    await venue.save();
    res.status(200).json({ message: "Venue verification checklist updated successfully.", venue });
  } catch (error) {
    res.status(500).json({ message: "Failed to update venue verification", error: error.message });
  }
});

// ── COUPLES / USERS ENDPOINTS ────────────────────────────────────────────────

// GET /api/super-admin/couples — get all couples
router.get("/couples", async (req, res) => {
  try {
    const couples = await User.find({ role: { $ne: "admin" } }).select("-password -resetPasswordToken -resetPasswordExpires").sort({ createdAt: -1 });
    res.status(200).json(couples);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch couples", error: error.message });
  }
});

// PUT /api/super-admin/couples/tier/:id — manually update couple tier
router.put("/couples/tier/:id", async (req, res) => {
  try {
    const { tier } = req.body;
    if (!["unpaid", "free", "plus", "pro"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier." });
    }

    const user = await User.findById(req.id || req.params.id);
    if (!user) return res.status(404).json({ message: "Couple account not found." });

    user.tier = tier;
    await user.save();
    res.status(200).json({ message: `Manually set couple tier to ${tier === "free" ? "CLASSIC" : tier.toUpperCase()}`, user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update couple tier", error: error.message });
  }
});

// DELETE /api/super-admin/couples/:id — cascade delete couple account
router.delete("/couples/:id", async (req, res) => {
  try {
    const userId = req.id || req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Couple account not found." });

    // 1. Delete all inquiries sent by user
    await Inquiry.deleteMany({ user: userId });

    // 2. Find all invitations belonging to this user
    const invitations = await Invitation.find({ userId });
    const invitationIds = invitations.map((inv) => inv._id);

    // 3. Delete all RSVPs linked to those invitations
    await RSVP.deleteMany({ invitationId: { $in: invitationIds } });

    // 4. Delete the invitations themselves
    await Invitation.deleteMany({ userId });

    // 5. Delete the User account
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Couple account, invitations, RSVPs, and inquiry logs successfully cascade deleted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete couple account", error: error.message });
  }
});

// ── INQUIRIES ENDPOINTS ──────────────────────────────────────────────────────

// GET /api/super-admin/inquiries — get all logged inquiries
router.get("/inquiries", async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate("user", "partner1Name partner2Name email weddingDate")
      .populate("venue", "name city ownerEmail")
      .sort({ createdAt: -1 });
    res.status(200).json(inquiries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inquiries", error: error.message });
  }
});

module.exports = router;
