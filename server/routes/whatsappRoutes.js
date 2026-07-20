const express = require("express");
const axios = require("axios");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const {
  getWhatsAppConfigStatus,
  isWhatsAppCloudConfigured,
  normalizeWhatsAppPhone,
  sendInvitationTemplate,
} = require("../utils/whatsappCloud");
const {
  applyWhatsAppSendPackPurchase,
  getWhatsAppSendPack,
  getWhatsAppSendPacks,
  getWhatsAppUsage,
  recordWhatsAppSend,
  refundWhatsAppSendCredit,
  reserveWhatsAppSendCredit,
} = require("../utils/whatsappCredits");

const router = express.Router();
const CLOUD_FINAL_OR_PENDING_STATUSES = ["queued", "sent", "delivered", "read"];

const getPublicSiteUrl = () =>
  String(process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173")
    .replace(/\/+$/, "");

const requireProWorkspace = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "partner1Name partner2Name email tier whatsappCloudIncludedSends whatsappCloudExtraSends whatsappCloudSendsUsed",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if ((user.tier || "unpaid") !== "pro") {
      return res.status(403).json({ message: "Cloud WhatsApp broadcast is available on the Pro plan." });
    }
    req.currentUser = user;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify WhatsApp access.", error: error.message });
  }
};

const buildInviteLink = (invitation) => `${getPublicSiteUrl()}/invite/${invitation.slug}`;

const buildCoupleNames = (user) => {
  const partner1 = user?.partner1Name || "Partner 1";
  const partner2 = user?.partner2Name || "Partner 2";
  return `${partner1} and ${partner2}`;
};

const markInvitationFailure = async (invitation, reason) => {
  invitation.whatsappStatus = "failed";
  invitation.whatsappProvider = "cloud_api";
  invitation.whatsappFailedAt = new Date();
  invitation.whatsappFailureReason = reason || "WhatsApp send failed.";
  await invitation.save();
};

const logCloudSendAccepted = (result, invitation) => {
  console.info("[WHATSAPP SEND] Meta accepted template send.", {
    messageId: result.messageId,
    invitationId: String(invitation._id),
    status: result.response?.messages?.[0]?.message_status,
    contactId: result.response?.contacts?.[0]?.wa_id,
  });
};

const recordAcceptedSend = async ({ userId, invitation, phone, result }) => {
  try {
    await recordWhatsAppSend({
      userId,
      invitation,
      normalizedPhone: phone,
      messageId: result.messageId,
    });
  } catch (error) {
    console.warn("[WHATSAPP SEND] Accepted send was not written to ledger.", {
      invitationId: String(invitation._id),
      messageId: result.messageId,
      error: error.message,
    });
  }
};

const applyCloudStatus = (invitation, status, failureReason = "") => {
  const now = new Date();
  invitation.whatsappProvider = "cloud_api";

  if (status === "sent") {
    invitation.whatsappStatus = "sent";
    invitation.whatsappSentAt = invitation.whatsappSentAt || now;
    invitation.whatsappSentBy = "WhatsApp Cloud API";
    invitation.whatsappFailureReason = "";
  }

  if (status === "delivered") {
    invitation.whatsappStatus = "delivered";
    invitation.whatsappDeliveredAt = now;
  }

  if (status === "read") {
    invitation.whatsappStatus = "read";
    invitation.whatsappReadAt = now;
  }

  if (status === "failed") {
    invitation.whatsappStatus = "failed";
    invitation.whatsappFailedAt = now;
    invitation.whatsappFailureReason = failureReason || "WhatsApp delivery failed.";
  }
};

router.get("/config-status", protect, requireProWorkspace, (req, res) => {
  const status = getWhatsAppConfigStatus();
  res.json({
    configured: status.configured,
    templateName: status.templateName,
    languageCode: status.languageCode,
    usage: getWhatsAppUsage(req.currentUser),
    missing: {
      phoneNumberId: !status.phoneNumberId,
      businessAccountId: !status.businessAccountId,
      accessToken: !status.accessToken,
      webhookVerifyToken: !status.webhookVerifyToken,
    },
  });
});

router.get("/send-packs", protect, requireProWorkspace, (req, res) => {
  res.json({
    packs: getWhatsAppSendPacks(),
    usage: getWhatsAppUsage(req.currentUser),
  });
});

router.post("/send-packs/verify", protect, requireProWorkspace, async (req, res) => {
  try {
    const { reference, packId } = req.body;
    if (!reference || !packId) {
      return res.status(400).json({ message: "Reference and send pack are required." });
    }

    const pack = getWhatsAppSendPack(packId);
    if (!pack) {
      return res.status(400).json({ message: "Invalid WhatsApp send pack." });
    }

    if (String(reference).startsWith("MOCK-")) {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ message: "Test payments are disabled in production." });
      }
      const { alreadyApplied, user } = await applyWhatsAppSendPackPurchase({
        userId: req.user.id,
        reference,
        pack,
      });
      return res.json({
        message: alreadyApplied ? `${pack.label} was already added.` : `${pack.label} added successfully.`,
        pack,
        usage: getWhatsAppUsage(user),
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({ message: "Paystack secret key is not configured." });
    }

    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });

    if (response.data.status !== true || response.data.data.status !== "success") {
      return res.status(400).json({ message: "Payment verification failed on Paystack." });
    }

    const paystackData = response.data.data;
    const metadata = paystackData.metadata || {};
    if (metadata.paymentType !== "whatsapp_send_pack" || metadata.packId !== pack.id) {
      return res.status(400).json({ message: "Payment metadata does not match this WhatsApp send pack." });
    }

    if (paystackData.currency !== "NGN") {
      return res.status(400).json({ message: "WhatsApp send packs must be paid in NGN." });
    }

    const expectedAmount = pack.priceInNgn * 100;
    const minAllowed = expectedAmount * 0.95;
    const maxAllowed = expectedAmount * 1.05;
    if (paystackData.amount < minAllowed || paystackData.amount > maxAllowed) {
      return res.status(400).json({ message: "Payment amount mismatch for this WhatsApp send pack." });
    }

    const { alreadyApplied, user } = await applyWhatsAppSendPackPurchase({
      userId: req.user.id,
      reference,
      pack,
    });
    return res.json({
      message: alreadyApplied ? `${pack.label} was already added.` : `${pack.label} added successfully.`,
      pack,
      usage: getWhatsAppUsage(user),
    });
  } catch (error) {
    console.error("WhatsApp send pack verification error:", error.response?.data || error.message);
    return res.status(500).json({ message: error.message || "Failed to verify WhatsApp send pack." });
  }
});

router.post("/send/:id", protect, requireProWorkspace, async (req, res) => {
  let invitation;
  let creditReserved = false;
  let metaAccepted = false;
  try {
    if (!isWhatsAppCloudConfigured()) {
      return res.status(503).json({
        message: "WhatsApp Cloud API is not configured yet. Add the required Render environment variables first.",
      });
    }

    invitation = await Invitation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const phone = normalizeWhatsAppPhone(invitation.phoneNumber);
    if (!phone) {
      invitation.whatsappStatus = "missing_number";
      invitation.whatsappProvider = "cloud_api";
      await invitation.save();
      return res.status(400).json({ message: "This guest does not have a valid WhatsApp phone number." });
    }

    if (CLOUD_FINAL_OR_PENDING_STATUSES.includes(invitation.whatsappStatus)) {
      return res.status(409).json({ message: "This guest already has a pending or completed WhatsApp invitation." });
    }

    const reservation = await reserveWhatsAppSendCredit(req.user.id);
    if (!reservation.reserved) {
      return res.status(402).json({
        message: "Your included WhatsApp sends are finished. Add a WhatsApp send pack to continue one-click sending.",
        usage: reservation.usage,
      });
    }
    creditReserved = true;

    const result = await sendInvitationTemplate({
      to: phone,
      guestName: invitation.guestName,
      coupleNames: buildCoupleNames(req.currentUser),
      inviteLink: buildInviteLink(invitation),
    });
    metaAccepted = true;

    invitation.whatsappStatus = "queued";
    invitation.whatsappProvider = "cloud_api";
    invitation.whatsappMessageId = result.messageId;
    invitation.whatsappSentAt = new Date();
    invitation.whatsappSentBy = "WhatsApp Cloud API";
    invitation.whatsappFailureReason = "";
    invitation.whatsappFailedAt = undefined;
    await invitation.save();
    await recordAcceptedSend({ userId: req.user.id, invitation, phone, result });
    logCloudSendAccepted(result, invitation);

    return res.json({
      message: "WhatsApp invitation submitted to Meta.",
      data: invitation,
      usage: reservation.usage,
    });
  } catch (error) {
    if (invitation) {
      await markInvitationFailure(invitation, error.message);
    }
    if (creditReserved && !metaAccepted) {
      await refundWhatsAppSendCredit(req.user.id);
    }
    return res.status(500).json({ message: error.message || "Failed to send WhatsApp invitation." });
  }
});

router.post("/send-bulk", protect, requireProWorkspace, async (req, res) => {
  try {
    if (!isWhatsAppCloudConfigured()) {
      return res.status(503).json({
        message: "WhatsApp Cloud API is not configured yet. Add the required Render environment variables first.",
      });
    }

    const invitationIds = Array.isArray(req.body.invitationIds) ? req.body.invitationIds : [];
    const uniqueIds = [...new Set(invitationIds.map(String))].slice(0, 100);

    if (uniqueIds.length === 0) {
      return res.status(400).json({ message: "Select at least one guest to send." });
    }

    const invitations = await Invitation.find({ _id: { $in: uniqueIds }, userId: req.user.id });
    const results = [];
    let submitted = 0;
    let failed = 0;
    let skipped = 0;
    let creditSkipped = 0;
    let latestUsage = getWhatsAppUsage(req.currentUser);

    for (const invitation of invitations) {
      if (CLOUD_FINAL_OR_PENDING_STATUSES.includes(invitation.whatsappStatus)) {
        skipped++;
        results.push({ id: invitation._id, status: invitation.whatsappStatus, data: invitation });
        continue;
      }

      const phone = normalizeWhatsAppPhone(invitation.phoneNumber);
      if (!phone) {
        skipped++;
        invitation.whatsappStatus = "missing_number";
        invitation.whatsappProvider = "cloud_api";
        await invitation.save();
        results.push({ id: invitation._id, status: "missing_number", data: invitation });
        continue;
      }

      let creditReserved = false;
      let metaAccepted = false;
      try {
        const reservation = await reserveWhatsAppSendCredit(req.user.id);
        if (!reservation.reserved) {
          skipped++;
          creditSkipped++;
          latestUsage = reservation.usage;
          results.push({
            id: invitation._id,
            status: "skipped",
            message: "WhatsApp send allowance exhausted.",
            data: invitation,
          });
          continue;
        }
        creditReserved = true;
        latestUsage = reservation.usage;

        const result = await sendInvitationTemplate({
          to: phone,
          guestName: invitation.guestName,
          coupleNames: buildCoupleNames(req.currentUser),
          inviteLink: buildInviteLink(invitation),
        });
        metaAccepted = true;

        submitted++;
        invitation.whatsappStatus = "queued";
        invitation.whatsappProvider = "cloud_api";
        invitation.whatsappMessageId = result.messageId;
        invitation.whatsappSentAt = new Date();
        invitation.whatsappSentBy = "WhatsApp Cloud API";
        invitation.whatsappFailureReason = "";
        invitation.whatsappFailedAt = undefined;
        await invitation.save();
        await recordAcceptedSend({ userId: req.user.id, invitation, phone, result });
        logCloudSendAccepted(result, invitation);
        results.push({ id: invitation._id, status: "queued", data: invitation });
      } catch (error) {
        failed++;
        if (creditReserved && !metaAccepted) {
          latestUsage = await refundWhatsAppSendCredit(req.user.id);
        }
        await markInvitationFailure(invitation, error.message);
        results.push({ id: invitation._id, status: "failed", message: error.message, data: invitation });
      }
    }

    return res.json({
      message: `WhatsApp submit complete: ${submitted} submitted, ${failed} failed, ${skipped} skipped.`,
      sent: submitted,
      submitted,
      failed,
      skipped,
      creditSkipped,
      usage: latestUsage,
      results,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to send WhatsApp invitations." });
  }
});

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    let statusUpdates = 0;
    let matchedUpdates = 0;
    let incomingMessages = 0;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];
        if (messages.length > 0) {
          incomingMessages += messages.length;
          console.info("[WHATSAPP WEBHOOK] Incoming message update received.", {
            messages: messages.length,
            field: change.field,
          });
        }

        const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        for (const update of statuses) {
          statusUpdates++;
          const failureReason = update?.errors?.[0]?.message || update?.errors?.[0]?.title || "";
          const invitation = await Invitation.findOne({ whatsappMessageId: update.id });
          if (!invitation) {
            console.warn("[WHATSAPP WEBHOOK] Status update did not match an invitation.", {
              messageId: update.id,
              status: update.status,
              failureReason,
            });
            continue;
          }

          matchedUpdates++;
          applyCloudStatus(invitation, update.status, failureReason);
          await invitation.save();

          console.info("[WHATSAPP WEBHOOK] Status update applied.", {
            messageId: update.id,
            status: update.status,
            invitationId: String(invitation._id),
            failureReason,
          });
        }
      }
    }

    if (statusUpdates > 0) {
      console.info("[WHATSAPP WEBHOOK] Processed status updates.", {
        statusUpdates,
        matchedUpdates,
      });
    }

    if (incomingMessages > 0 && statusUpdates === 0) {
      console.info("[WHATSAPP WEBHOOK] Processed incoming message updates.", {
        incomingMessages,
      });
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK] Failed to process update:", error.message);
    return res.sendStatus(200);
  }
});

module.exports = router;
