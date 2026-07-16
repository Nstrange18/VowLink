const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Invitation = require("../models/Invitation");
const RSVP = require("../models/RSVP");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const createSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
const createCheckInToken = () => crypto.randomBytes(24).toString("hex");

const createCheckInAccessToken = (userId, pinUpdatedAt) =>
  jwt.sign(
    {
      type: "check_in",
      userId: String(userId),
      pinUpdatedAt: pinUpdatedAt ? new Date(pinUpdatedAt).toISOString() : null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "18h" }
  );

const getOptionalUserFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const isSuperAdminUser = (authUser) =>
  authUser?.role === "admin" &&
  authUser?.email?.toLowerCase() === "nwubachukwuemelie@gmail.com";

const canUseCheckIn = (user) => ["plus", "pro"].includes(user?.tier || "unpaid");
const canUseAdvancedCheckIn = (user) => (user?.tier || "unpaid") === "pro";

const requireActiveWorkspace = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("tier");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if ((user.tier || "unpaid") === "unpaid") {
      return res.status(403).json({ message: "Choose a plan to activate your wedding workspace." });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify plan access", error: error.message });
  }
};

const requireProWorkspace = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("tier");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if ((user.tier || "unpaid") !== "pro") {
      return res.status(403).json({ message: "This action is available on the Pro plan." });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify plan access", error: error.message });
  }
};

const getCheckInAccessForEvent = async (req, userId) => {
  if (!req.body?.accessToken) return false;

  try {
    const decoded = jwt.verify(req.body.accessToken, process.env.JWT_SECRET);
    if (decoded.type !== "check_in" || String(decoded.userId) !== String(userId)) return false;

    const user = await User.findById(userId).select("checkInPinHash checkInPinUpdatedAt tier");
    if (!user?.checkInPinHash || !user.checkInPinUpdatedAt || !decoded.pinUpdatedAt) return false;

    return new Date(user.checkInPinUpdatedAt).toISOString() === decoded.pinUpdatedAt;
  } catch {
    return false;
  }
};

const getCheckInAuthority = async (req, userId) => {
  const authUser = getOptionalUserFromRequest(req);
  const isOwner = authUser && String(userId) === String(authUser.id);
  const isSuperAdmin = isSuperAdminUser(authUser);
  const hasCheckInAccess = await getCheckInAccessForEvent(req, userId);
  const via = isSuperAdmin ? "admin" : isOwner ? "couple" : hasCheckInAccess ? "pin" : "unknown";

  return { authUser, isOwner, isSuperAdmin, hasCheckInAccess, via };
};

const ensureInvitationCheckInToken = async (invitation) => {
  if (invitation.checkInToken) return invitation.checkInToken;

  let token = createCheckInToken();
  while (await Invitation.exists({ checkInToken: token })) {
    token = createCheckInToken();
  }

  invitation.checkInToken = token;
  await invitation.save();
  return token;
};

const cleanWhatsAppNumber = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s+\-()]/g, "");
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = "234" + cleaned.substring(1);
  }
  if (cleaned.length < 7 || !/^\d+$/.test(cleaned)) {
    return "";
  }
  return cleaned;
};

router.get("/slug/:slug", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      slug: req.params.slug,
    }).populate(
      "userId",
      "partner1Name partner2Name weddingDate weddingTime rsvpDeadline venue venueName receptionLocation receptionName dressCode weddingColors plusOnePolicy kidsAllowed cardTheme defaultGuestTheme customCardBg pageBgTemplate customTextColor customTextColors userHasCustomTextColor customFontFamily customVerticalOffset customTextSize customTextSizeTitle customTextSizeSubtitle customTextSizeCoupleNames customTextSizeGreeting customTextSizeMessage customTextSizeDetails customTextSizeReception customTextSizeColors customTextBoldness couplePhotoUrl customShareMessage coupleOverlayOpacity musicUrl galleryPhotos tier registryEnabled registryBankName registryAccountName registryAccountNumber registryNotes honeymoonFundTarget honeymoonFundCurrent timeline customTextAlign userHasCustomAlignment customHorizontalOffset smartLayoutEnabled email",
    );

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if ((invitation.userId?.tier || "unpaid") === "unpaid") {
      return res.status(403).json({ message: "This wedding workspace is not active yet." });
    }

    await ensureInvitationCheckInToken(invitation);

    res.status(200).json(invitation);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch invitation", error: error.message });
  }
});

// GET /api/invitations/slug/:slug/wishes — public endpoint to fetch wedding guest wishes
router.get("/slug/:slug/wishes", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ slug: req.params.slug });
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Find all invitations belonging to the same couple
    const coupleInvitations = await Invitation.find({ userId: invitation.userId });
    const invitationIds = coupleInvitations.map(i => i._id);

    // Find all RSVPs for these invitations with messages and attending 'Yes'
    const RSVP = require("../models/RSVP");
    const wishes = await RSVP.find({
      invitationId: { $in: invitationIds },
      attending: "Yes",
      message: { $ne: "", $exists: true }
    }).select("guestName message createdAt").sort({ createdAt: -1 });

    res.status(200).json(wishes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wishes", error: error.message });
  }
});

// GET /api/invitations/check-in/:token - QR scan preview for ushers
router.get("/check-in/:token", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ checkInToken: req.params.token }).populate(
      "userId",
      "partner1Name partner2Name weddingDate venue venueName checkInPinHash tier"
    );

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or expired check-in QR code." });
    }

    if (!canUseCheckIn(invitation.userId)) {
      return res.status(403).json({ message: "Guest entry QR check-in is available on Plus and Pro plans." });
    }

    res.status(200).json({
      invitationId: invitation._id,
      eventId: invitation.userId?._id || invitation.userId,
      checkInPinEnabled: Boolean(invitation.userId?.checkInPinHash),
      guestName: invitation.guestName,
      category: invitation.category,
      allowedGuests: invitation.allowedGuests,
      hasRSVPed: invitation.hasRSVPed,
      checkedIn: invitation.checkedIn,
      checkedInAt: invitation.checkedInAt,
      couple: invitation.userId
        ? {
            partner1Name: invitation.userId.partner1Name,
            partner2Name: invitation.userId.partner2Name,
            weddingDate: invitation.userId.weddingDate,
            venue: invitation.userId.venueName || invitation.userId.venue,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load check-in details", error: error.message });
  }
});

// POST /api/invitations/check-in/:token/access - validate event check-in PIN
router.post("/check-in/:token/access", async (req, res) => {
  try {
    const { pin } = req.body;
    const invitation = await Invitation.findOne({ checkInToken: req.params.token }).populate(
      "userId",
      "checkInPinHash checkInPinUpdatedAt tier"
    );

    if (!invitation || !invitation.userId) {
      return res.status(404).json({ message: "Invalid or expired check-in QR code." });
    }

    if (!canUseCheckIn(invitation.userId)) {
      return res.status(403).json({ message: "Guest entry QR check-in is available on Plus and Pro plans." });
    }

    if (!invitation.userId.checkInPinHash) {
      return res.status(403).json({ message: "This wedding has not enabled check-in PIN access yet." });
    }

    const isValidPin = await bcrypt.compare(String(pin || "").trim(), invitation.userId.checkInPinHash);
    if (!isValidPin) {
      return res.status(403).json({ message: "Invalid check-in PIN." });
    }

    res.status(200).json({
      message: "Check-in access granted.",
      accessToken: createCheckInAccessToken(invitation.userId._id, invitation.userId.checkInPinUpdatedAt),
      expiresIn: "18h",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to validate check-in PIN", error: error.message });
  }
});

// POST /api/invitations/check-in/:token - mark a guest as checked in
router.post("/check-in/:token", async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ checkInToken: req.params.token }).populate("userId", "tier");

    if (!invitation) {
      return res.status(404).json({ message: "Invalid or expired check-in QR code." });
    }

    if (!canUseCheckIn(invitation.userId)) {
      return res.status(403).json({ message: "Guest entry QR check-in is available on Plus and Pro plans." });
    }

    const eventUserId = invitation.userId?._id || invitation.userId;
    const { authUser, isOwner, isSuperAdmin, hasCheckInAccess, via } = await getCheckInAuthority(req, eventUserId);

    if (!isOwner && !isSuperAdmin && !hasCheckInAccess) {
      return res.status(403).json({ message: "Enter the event check-in PIN before checking in guests." });
    }

    if (invitation.checkedIn) {
      return res.status(200).json({ message: "Guest was already checked in.", invitation });
    }

    invitation.checkedIn = true;
    invitation.checkedInAt = new Date();
    invitation.checkedInBy = authUser?.id || undefined;
    invitation.checkedInVia = via;
    invitation.checkInHistory.push({
      action: "checked_in",
      at: invitation.checkedInAt,
      via,
      by: authUser?.id || undefined,
      note: via === "pin" ? "Checked in by usher PIN access." : "Checked in from authorized account.",
    });
    await invitation.save();

    res.status(200).json({ message: "Guest checked in successfully.", invitation });
  } catch (error) {
    res.status(500).json({ message: "Failed to check in guest", error: error.message });
  }
});
// POST /api/invitations/check-in/staff/search - search guests for event-day check-in
router.post("/check-in/staff/search", async (req, res) => {
  try {
    const { eventId, accessToken, query = "", status = "all" } = req.body;

    if (!eventId || !accessToken) {
      return res.status(400).json({ message: "Event access is required for staff search." });
    }

    const eventOwner = await User.findById(eventId).select("tier");
    if (!canUseAdvancedCheckIn(eventOwner)) {
      return res.status(403).json({ message: "Staff check-in search mode is available on the Pro plan." });
    }

    const hasCheckInAccess = await getCheckInAccessForEvent({ body: { accessToken } }, eventId);
    if (!hasCheckInAccess) {
      return res.status(403).json({ message: "Enter the event check-in PIN before searching guests." });
    }

    const filter = { userId: eventId };
    const trimmedQuery = String(query || "").trim();
    if (trimmedQuery) {
      filter.$or = [
        { guestName: { $regex: trimmedQuery, $options: "i" } },
        { phoneNumber: { $regex: trimmedQuery, $options: "i" } },
        { slug: { $regex: trimmedQuery, $options: "i" } },
        { category: { $regex: trimmedQuery, $options: "i" } },
      ];
    }
    if (status === "checked_in") filter.checkedIn = true;
    if (status === "not_checked_in") filter.checkedIn = { $ne: true };

    const invitations = await Invitation.find(filter)
      .select("guestName category allowedGuests phoneNumber slug hasRSVPed checkedIn checkedInAt checkedInVia checkInHistory")
      .sort({ checkedIn: 1, guestName: 1 })
      .limit(30);

    res.status(200).json({ invitations });
  } catch (error) {
    res.status(500).json({ message: "Failed to search check-in guests", error: error.message });
  }
});

// POST /api/invitations/check-in/staff/:id - check in guest from staff search
router.post("/check-in/staff/:id", async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const eventOwner = await User.findById(invitation.userId).select("tier");
    if (!canUseAdvancedCheckIn(eventOwner)) {
      return res.status(403).json({ message: "Staff check-in mode is available on the Pro plan." });
    }

    const hasCheckInAccess = await getCheckInAccessForEvent(req, invitation.userId);
    if (!hasCheckInAccess) {
      return res.status(403).json({ message: "Enter the event check-in PIN before checking in guests." });
    }

    if (invitation.checkedIn) {
      return res.status(200).json({ message: "Guest was already checked in.", invitation });
    }

    invitation.checkedIn = true;
    invitation.checkedInAt = new Date();
    invitation.checkedInBy = undefined;
    invitation.checkedInVia = "pin";
    invitation.checkInHistory.push({
      action: "checked_in",
      at: invitation.checkedInAt,
      via: "pin",
      note: "Checked in from staff mode.",
    });
    await invitation.save();

    res.status(200).json({ message: "Guest checked in successfully.", invitation });
  } catch (error) {
    res.status(500).json({ message: "Failed to check in guest", error: error.message });
  }
});
// --- PROTECTED: All routes below require login -------------------------------

// Create invitation
router.post("/", protect, async (req, res) => {
  try {
    const { guestName, greeting, customMessage, allowedGuests, category, phoneNumber, senderGroup } =
      req.body;

    if (!guestName || !greeting || !customMessage) {
      return res.status(400).json({
        message: "Guest name, greeting, and custom message are required.",
      });
    }

    if (customMessage.trim().length > 170) {
      return res.status(400).json({
        message: "Personal message cannot be more than 170 characters.",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Limit check based on tier
    if ((user.tier || "unpaid") === "unpaid") {
      return res.status(403).json({
        message: "Choose a plan to activate your wedding workspace before creating live invitations.",
      });
    }
    const count = await Invitation.countDocuments({ userId: req.user.id });
    if (user.tier === "free" && count >= 1) {
      return res.status(403).json({
        message: "You have reached the maximum limit of 1 invitation link for the Classic plan. Please upgrade to Plus or Pro to create personalized guest links.",
      });
    }
    if (user.tier === "plus" && count >= 100) {
      return res.status(403).json({
        message: "You have reached the maximum limit of 100 invitations for the Plus plan. Please upgrade to Pro for more invitations.",
      });
    }
    if (user.tier === "pro" && count >= 500) {
      return res.status(403).json({
        message: "You have reached the maximum limit of 500 invitations for the Pro plan.",
      });
    }

    let slug = createSlug(guestName);
    const existing = await Invitation.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const invitation = await Invitation.create({
      userId: req.user.id,
      createdBy: req.user.id,
      guestName,
      slug,
      greeting,
      customMessage,
      allowedGuests,
      category,
      phoneNumber: phoneNumber || "",
      senderGroup: senderGroup || "general",
      createdByPartner: senderGroup || "general",
      checkInToken: createCheckInToken(),
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

    if ((user.tier || "unpaid") === "unpaid" || user.tier === "free") {
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
    if (user.tier === "pro" && currentCount + guests.length > 500) {
      return res.status(403).json({
        message: `Creating ${guests.length} invitations will exceed your Pro plan limit of 500. Current total: ${currentCount}.`,
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
      if (customMessage.length > 170) {
        customMessage = customMessage.substring(0, 170);
      }
      const allowedGuests = Number(g.allowedGuests) || 1;
      const category = g.category?.trim() || "Guest";

      let slug = createSlug(guestName);
      // To prevent bulk collisions, append unique timestamps for duplicates
      const existing = await Invitation.findOne({ slug });
      if (existing || createdInvitations.some(ci => ci.slug === slug)) {
        slug = `${slug}-${now}-${i}`;
      }

      const rawPhone = g.phoneNumber || g.phone || g.whatsappPhone || "";
      const cleanedPhone = cleanWhatsAppNumber(String(rawPhone).trim());
      const whatsappStatus = cleanedPhone ? "not_sent" : "missing_number";
      const senderGroup = ["bride", "groom", "both", "general"].includes(String(g.senderGroup || "").trim().toLowerCase())
        ? String(g.senderGroup).trim().toLowerCase()
        : "general";

      createdInvitations.push({
        userId: req.user.id,
        createdBy: req.user.id,
        guestName,
        slug,
        greeting,
        customMessage,
        allowedGuests,
        category,
        phoneNumber: cleanedPhone,
        whatsappStatus,
        senderGroup,
        createdByPartner: senderGroup,
        checkInToken: createCheckInToken(),
      });
    }

    if (createdInvitations.length === 0) {
      return res.status(400).json({ message: "No valid guests to import." });
    }

    const result = await Invitation.insertMany(createdInvitations);

    res.status(201).json({
      message: `Successfully imported ${result.length} invitations!`,
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
    await Promise.all(invitations.map((inv) => ensureInvitationCheckInToken(inv)));

    const updatedInvitations = invitations.map(inv => {
      const doc = inv.toObject();
      if (!doc.senderGroup) doc.senderGroup = "general";
      if (!doc.whatsappStatus) {
        doc.whatsappStatus = doc.phoneNumber ? "not_sent" : "missing_number";
      }
      return doc;
    });
    res.status(200).json(updatedInvitations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch invitations", error: error.message });
  }
});

// Reset guest check-in status (owner only)
router.patch("/:id/check-in/reset", protect, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const user = await User.findById(req.user.id).select("tier");
    if (!canUseAdvancedCheckIn(user)) {
      return res.status(403).json({ message: "Check-in reset controls are available on the Pro plan." });
    }

    if (!invitation.checkedIn) {
      return res.status(200).json({ message: "Guest is already marked as not checked in.", invitation });
    }

    invitation.checkedIn = false;
    invitation.checkedInAt = undefined;
    invitation.checkedInBy = undefined;
    invitation.checkedInVia = "unknown";
    invitation.checkInHistory.push({
      action: "reset",
      at: new Date(),
      via: "couple",
      by: req.user.id,
      note: "Check-in reset from couple dashboard.",
    });
    await invitation.save();

    res.status(200).json({ message: "Guest check-in has been reset.", invitation });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset check-in", error: error.message });
  }
});
// Update invitation (owner only)
router.put("/:id", protect, requireActiveWorkspace, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const { customMessage } = req.body;
    if (customMessage && customMessage.trim().length > 170) {
      return res.status(400).json({
        message: "Personal message cannot be more than 170 characters.",
      });
    }

    if (req.body.senderGroup !== undefined) {
      req.body.createdByPartner = req.body.senderGroup;
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

    await RSVP.deleteMany({ invitationId: invitation._id });

    res.status(200).json({ message: "Invitation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete invitation", error: error.message });
  }
});

// Update single invitation's WhatsApp status
router.patch("/:id/whatsapp-status", protect, requireProWorkspace, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const { whatsappStatus, whatsappSentBy } = req.body;
    
    if (whatsappStatus) {
      if (!["not_sent", "ready", "queued", "sent", "delivered", "read", "failed", "missing_number"].includes(whatsappStatus)) {
        return res.status(400).json({ message: "Invalid WhatsApp status value." });
      }
      invitation.whatsappStatus = whatsappStatus;
      if (whatsappStatus === "sent") {
        invitation.whatsappSentAt = new Date();
        invitation.whatsappSentBy = whatsappSentBy || req.user.email || "user";
        invitation.whatsappProvider = "manual";
        invitation.whatsappFailureReason = "";
      } else {
        invitation.whatsappSentAt = undefined;
        invitation.whatsappSentBy = undefined;
        invitation.whatsappMessageId = undefined;
        invitation.whatsappDeliveredAt = undefined;
        invitation.whatsappReadAt = undefined;
        invitation.whatsappFailedAt = undefined;
        invitation.whatsappFailureReason = "";
      }
    }

    await invitation.save();
    res.status(200).json({ message: "WhatsApp status updated successfully", data: invitation });
  } catch (error) {
    res.status(500).json({ message: "Failed to update WhatsApp status", error: error.message });
  }
});

// Update single invitation's sender group
router.patch("/:id/sender-group", protect, requireActiveWorkspace, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    const { senderGroup } = req.body;
    if (senderGroup) {
      if (!["bride", "groom", "both", "general"].includes(senderGroup)) {
        return res.status(400).json({ message: "Invalid sender group" });
      }
      invitation.senderGroup = senderGroup;
      invitation.createdByPartner = senderGroup;
    }

    await invitation.save();
    res.status(200).json({ message: "Sender group updated successfully", data: invitation });
  } catch (error) {
    res.status(500).json({ message: "Failed to update sender group", error: error.message });
  }
});

// Bulk update sender group for selected invitations
router.post("/bulk-update-sender-group", protect, requireActiveWorkspace, async (req, res) => {
  try {
    const { invitationIds, senderGroup } = req.body;
    if (!Array.isArray(invitationIds) || invitationIds.length === 0) {
      return res.status(400).json({ message: "An array of invitation IDs is required." });
    }
    if (!["bride", "groom", "both", "general"].includes(senderGroup)) {
      return res.status(400).json({ message: "Invalid sender group value." });
    }

    await Invitation.updateMany(
      { _id: { $in: invitationIds }, userId: req.user.id },
      { $set: { senderGroup, createdByPartner: senderGroup } }
    );

    res.status(200).json({ message: `Successfully updated sender group to '${senderGroup}' for ${invitationIds.length} invitations.` });
  } catch (error) {
    res.status(500).json({ message: "Failed to bulk update sender group", error: error.message });
  }
});

module.exports = router;








