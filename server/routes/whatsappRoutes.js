const express = require("express");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const {
  getWhatsAppConfigStatus,
  isWhatsAppCloudConfigured,
  normalizeWhatsAppPhone,
  sendInvitationTemplate,
} = require("../utils/whatsappCloud");

const router = express.Router();

const getPublicSiteUrl = () =>
  String(process.env.PUBLIC_SITE_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173")
    .replace(/\/+$/, "");

const requireProWorkspace = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("partner1Name partner2Name email tier");
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
    missing: {
      phoneNumberId: !status.phoneNumberId,
      businessAccountId: !status.businessAccountId,
      accessToken: !status.accessToken,
      webhookVerifyToken: !status.webhookVerifyToken,
    },
  });
});

router.post("/send/:id", protect, requireProWorkspace, async (req, res) => {
  let invitation;
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

    if (["sent", "delivered", "read"].includes(invitation.whatsappStatus)) {
      return res.status(409).json({ message: "This guest has already been sent a WhatsApp invitation." });
    }

    const result = await sendInvitationTemplate({
      to: phone,
      guestName: invitation.guestName,
      coupleNames: buildCoupleNames(req.currentUser),
      inviteLink: buildInviteLink(invitation),
    });

    invitation.whatsappStatus = "sent";
    invitation.whatsappProvider = "cloud_api";
    invitation.whatsappMessageId = result.messageId;
    invitation.whatsappSentAt = new Date();
    invitation.whatsappSentBy = "WhatsApp Cloud API";
    invitation.whatsappFailureReason = "";
    invitation.whatsappFailedAt = undefined;
    await invitation.save();

    return res.json({ message: "WhatsApp invitation sent.", data: invitation });
  } catch (error) {
    if (invitation) {
      await markInvitationFailure(invitation, error.message);
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
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const invitation of invitations) {
      if (["sent", "delivered", "read"].includes(invitation.whatsappStatus)) {
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

      try {
        const result = await sendInvitationTemplate({
          to: phone,
          guestName: invitation.guestName,
          coupleNames: buildCoupleNames(req.currentUser),
          inviteLink: buildInviteLink(invitation),
        });

        sent++;
        invitation.whatsappStatus = "sent";
        invitation.whatsappProvider = "cloud_api";
        invitation.whatsappMessageId = result.messageId;
        invitation.whatsappSentAt = new Date();
        invitation.whatsappSentBy = "WhatsApp Cloud API";
        invitation.whatsappFailureReason = "";
        invitation.whatsappFailedAt = undefined;
        await invitation.save();
        results.push({ id: invitation._id, status: "sent", data: invitation });
      } catch (error) {
        failed++;
        await markInvitationFailure(invitation, error.message);
        results.push({ id: invitation._id, status: "failed", message: error.message, data: invitation });
      }
    }

    return res.json({
      message: `WhatsApp send complete: ${sent} sent, ${failed} failed, ${skipped} skipped.`,
      sent,
      failed,
      skipped,
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

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        for (const update of statuses) {
          const invitation = await Invitation.findOne({ whatsappMessageId: update.id });
          if (!invitation) continue;

          const failureReason = update?.errors?.[0]?.message || update?.errors?.[0]?.title || "";
          applyCloudStatus(invitation, update.status, failureReason);
          await invitation.save();
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK] Failed to process update:", error.message);
    return res.sendStatus(200);
  }
});

module.exports = router;
