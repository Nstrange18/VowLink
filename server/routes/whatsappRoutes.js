const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const { getSendDiagnostics } = require("../utils/whatsappSendDiagnostics");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const WhatsAppSendLedger = require("../models/WhatsAppSendLedger");
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
    console.error("[WHATSAPP SEND] Access check failed:", error.message);
    return res.status(500).json({ message: "WhatsApp sending is not ready yet." });
  }
};

const buildInviteLink = (invitation) => `${getPublicSiteUrl()}/invite/${invitation.slug}`;

const getWebhookAppSecret = () =>
  process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || "";

const verifyWhatsAppWebhookSignature = (req) => {
  const appSecret = getWebhookAppSecret();
  if (!appSecret.trim()) {
    console.warn("[WHATSAPP WEBHOOK] App secret is not configured; webhook verification was rejected.");
    return false;
  }

  const signature = String(req.get("x-hub-signature-256") || "");
  if (!/^sha256=[a-fA-F0-9]{64}$/.test(signature)) return false;

  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody
    : Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const received = signature.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const buildCoupleNames = (user) => {
  const partner1 = user?.partner1Name || "Partner 1";
  const partner2 = user?.partner2Name || "Partner 2";
  return `${partner1} and ${partner2}`;
};

const getPublicWhatsAppError = (error) => {
  const message = String(error?.message || error || "");
  if (/allowance|send pack|finished/i.test(message)) {
    return "You need more WhatsApp sends to continue.";
  }
  if (/phone|number/i.test(message)) {
    return "Check this guest's WhatsApp number and try again.";
  }
  if (/configured|environment|access token|phone number id/i.test(message)) {
    return "WhatsApp sending is not ready yet.";
  }
  if (/template|parameter|localizable_params/i.test(message)) {
    return "The WhatsApp template needs attention before this invite can be sent.";
  }
  return "We could not send this invite. Please try again.";
};

const markInvitationFailure = async (invitation, reason) => {
  invitation.whatsappStatus = "failed";
  invitation.whatsappProvider = "cloud_api";
  invitation.whatsappFailedAt = new Date();
  invitation.whatsappFailureReason = getPublicWhatsAppError(reason);
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
    invitation.whatsappFailureReason = getPublicWhatsAppError(
      failureReason || "WhatsApp delivery failed.",
    );
  }
};

router.get("/config-status", protect, requireProWorkspace, (req, res) => {
  const status = getWhatsAppConfigStatus();
  res.json({
    configured: status.configured,
    templateName: status.templateName,
    languageCode: status.languageCode,
    urlButtonIndex: status.urlButtonIndex,
    urlButtonValueMode: status.urlButtonValueMode,
    webhookSignatureConfigured: Boolean(getWebhookAppSecret()),
    usage: getWhatsAppUsage(req.currentUser),
    missing: {
      phoneNumberId: !status.phoneNumberId,
      businessAccountId: !status.businessAccountId,
      accessToken: !status.accessToken,
      webhookVerifyToken: !status.webhookVerifyToken,
      webhookAppSecret: !getWebhookAppSecret(),
    },
  });
});

router.get("/send-packs", protect, requireProWorkspace, (req, res) => {
  res.json({
    packs: getWhatsAppSendPacks(),
    usage: getWhatsAppUsage(req.currentUser),
  });
});

router.get("/send-history", protect, requireProWorkspace, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const entries = await WhatsAppSendLedger.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(
        "invitationId",
        "guestName phoneNumber whatsappStatus whatsappMessageId whatsappSentAt whatsappDeliveredAt whatsappReadAt whatsappFailedAt whatsappFailureReason slug",
      )
      .lean();

    const history = entries.map((entry) => {
      const invitation = entry.invitationId || {};
      const status = invitation.whatsappStatus || entry.status || "queued";
      return {
        id: String(entry._id),
        invitationId: invitation._id ? String(invitation._id) : String(entry.invitationId || ""),
        guestName: invitation.guestName || entry.metadata?.guestName || "Guest",
        phoneLast4: entry.phoneLast4 || "",
        status,
        messageId: invitation.whatsappMessageId || entry.whatsappMessageId || "",
        submittedAt: invitation.whatsappSentAt || entry.createdAt,
        deliveredAt: invitation.whatsappDeliveredAt || null,
        readAt: invitation.whatsappReadAt || null,
        failedAt: invitation.whatsappFailedAt || null,
        failureReason: invitation.whatsappFailureReason || "",
        inviteSlug: invitation.slug || "",
      };
    });

    return res.json({ history });
  } catch (error) {
    console.error("[WHATSAPP SEND] Could not load send history:", error.message);
    return res.status(500).json({ message: "Could not load WhatsApp send history." });
  }
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
        message: alreadyApplied ? "This send pack was already added." : `${pack.sends} sends added.`,
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
      message: alreadyApplied ? "This send pack was already added." : `${pack.sends} sends added.`,
      pack,
      usage: getWhatsAppUsage(user),
    });
  } catch (error) {
    console.error("WhatsApp send pack verification error:", error.response?.data || error.message);
    return res.status(500).json({ message: "We could not add the send pack. Please try again." });
  }
});

router.post("/send/:id", protect, requireProWorkspace, async (req, res) => {
  let invitation;
  let creditReserved = false;
  let metaAccepted = false;
  try {
    if (!isWhatsAppCloudConfigured()) {
      return res.status(503).json({
        message: "WhatsApp sending is not ready yet.",
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
      message: "Invite submitted.",
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
    console.error("[WHATSAPP SEND] Single invite failed:", error.response?.data || error.message);
    return res.status(500).json({ message: getPublicWhatsAppError(error) });
  }
});

router.post("/send-bulk", protect, requireProWorkspace, async (req, res) => {
  try {
    if (!isWhatsAppCloudConfigured()) {
      return res.status(503).json({
        message: "WhatsApp sending is not ready yet.",
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
        console.error("[WHATSAPP SEND] Individual bulk send failed.", getSendDiagnostics(error, metaAccepted));
        failed++;
        if (creditReserved && !metaAccepted) {
          latestUsage = await refundWhatsAppSendCredit(req.user.id);
        }
        const publicMessage = getPublicWhatsAppError(error);
        await markInvitationFailure(invitation, publicMessage);
        results.push({ id: invitation._id, status: "failed", message: publicMessage, data: invitation });
      }
    }

    return res.json({
      message: `${submitted} invite${submitted === 1 ? "" : "s"} submitted.`,
      sent: submitted,
      submitted,
      failed,
      skipped,
      creditSkipped,
      usage: latestUsage,
      results,
    });
  } catch (error) {
    console.error("[WHATSAPP SEND] Bulk send failed:", error.response?.data || error.message);
    return res.status(500).json({ message: getPublicWhatsAppError(error) });
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
  if (!verifyWhatsAppWebhookSignature(req)) {
    console.warn("[WHATSAPP WEBHOOK] Rejected update with an invalid Meta signature.");
    return res.sendStatus(403);
  }

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
