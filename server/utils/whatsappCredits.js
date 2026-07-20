const crypto = require("crypto");
const User = require("../models/User");
const WhatsAppSendLedger = require("../models/WhatsAppSendLedger");
const WhatsAppSendPackPurchase = require("../models/WhatsAppSendPackPurchase");

const DEFAULT_INCLUDED_WHATSAPP_SENDS = 100;

const WHATSAPP_SEND_PACKS = {
  whatsapp_100: {
    id: "whatsapp_100",
    sends: 100,
    priceInNgn: 5000,
    label: "100 WhatsApp sends",
  },
  whatsapp_250: {
    id: "whatsapp_250",
    sends: 250,
    priceInNgn: 12000,
    label: "250 WhatsApp sends",
  },
  whatsapp_500: {
    id: "whatsapp_500",
    sends: 500,
    priceInNgn: 22000,
    label: "500 WhatsApp sends",
  },
};

const getWhatsAppSendPacks = () => Object.values(WHATSAPP_SEND_PACKS);

const getWhatsAppSendPack = (packId) => WHATSAPP_SEND_PACKS[packId] || null;

const getWhatsAppIncludedSends = (user = {}) => {
  const value = Number(user.whatsappCloudIncludedSends);
  return Number.isFinite(value) ? value : DEFAULT_INCLUDED_WHATSAPP_SENDS;
};

const getWhatsAppExtraSends = (user = {}) => {
  const value = Number(user.whatsappCloudExtraSends);
  return Number.isFinite(value) ? value : 0;
};

const getWhatsAppSendsUsed = (user = {}) => {
  const value = Number(user.whatsappCloudSendsUsed);
  return Number.isFinite(value) ? value : 0;
};

const getWhatsAppUsage = (user = {}) => {
  const included = getWhatsAppIncludedSends(user);
  const extra = getWhatsAppExtraSends(user);
  const used = getWhatsAppSendsUsed(user);
  const limit = included + extra;

  return {
    included,
    extra,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
};

const reserveWhatsAppSendCredit = async (userId) => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      tier: "pro",
      $expr: {
        $lt: [
          { $ifNull: ["$whatsappCloudSendsUsed", 0] },
          {
            $add: [
              { $ifNull: ["$whatsappCloudIncludedSends", DEFAULT_INCLUDED_WHATSAPP_SENDS] },
              { $ifNull: ["$whatsappCloudExtraSends", 0] },
            ],
          },
        ],
      },
    },
    {
      $inc: { whatsappCloudSendsUsed: 1 },
      $setOnInsert: { whatsappCloudIncludedSends: DEFAULT_INCLUDED_WHATSAPP_SENDS },
    },
    { new: true },
  );

  if (!user) {
    const current = await User.findById(userId).select(
      "whatsappCloudIncludedSends whatsappCloudExtraSends whatsappCloudSendsUsed",
    );
    return {
      reserved: false,
      usage: getWhatsAppUsage(current || {}),
    };
  }

  return {
    reserved: true,
    usage: getWhatsAppUsage(user),
    user,
  };
};

const refundWhatsAppSendCredit = async (userId) => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      whatsappCloudSendsUsed: { $gt: 0 },
    },
    { $inc: { whatsappCloudSendsUsed: -1 } },
    { new: true },
  );

  return getWhatsAppUsage(user || {});
};

const getPhoneHash = (normalizedPhone) => {
  const secret = process.env.WHATSAPP_USAGE_HASH_SECRET || process.env.JWT_SECRET || "vowlink-whatsapp-usage";
  return crypto
    .createHmac("sha256", secret)
    .update(String(normalizedPhone || ""))
    .digest("hex");
};

const recordWhatsAppSend = async ({ userId, invitation, normalizedPhone, messageId }) => {
  return WhatsAppSendLedger.create({
    userId,
    invitationId: invitation._id,
    phoneHash: getPhoneHash(normalizedPhone),
    phoneLast4: String(normalizedPhone || "").slice(-4),
    whatsappMessageId: messageId || "",
    status: "accepted",
    metadata: {
      guestName: invitation.guestName || "",
      provider: "cloud_api",
    },
  });
};

const addWhatsAppExtraSends = async (userId, sends) => {
  const quantity = Number(sends);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Invalid WhatsApp send pack quantity.");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { whatsappCloudExtraSends: quantity },
      $setOnInsert: { whatsappCloudIncludedSends: DEFAULT_INCLUDED_WHATSAPP_SENDS },
    },
    { new: true },
  );

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

const applyWhatsAppSendPackPurchase = async ({ userId, reference, pack }) => {
  if (!pack) {
    throw new Error("Invalid WhatsApp send pack.");
  }

  try {
    await WhatsAppSendPackPurchase.create({
      reference,
      userId,
      packId: pack.id,
      sends: pack.sends,
      amountInNgn: pack.priceInNgn,
    });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await WhatsAppSendPackPurchase.findOne({ reference }).select("userId");
      if (!existing || String(existing.userId) !== String(userId)) {
        throw new Error("This payment reference has already been used.");
      }
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found.");
      return {
        alreadyApplied: true,
        user,
      };
    }
    throw error;
  }

  const user = await addWhatsAppExtraSends(userId, pack.sends);
  return {
    alreadyApplied: false,
    user,
  };
};

module.exports = {
  DEFAULT_INCLUDED_WHATSAPP_SENDS,
  WHATSAPP_SEND_PACKS,
  addWhatsAppExtraSends,
  applyWhatsAppSendPackPurchase,
  getWhatsAppSendPack,
  getWhatsAppSendPacks,
  getWhatsAppUsage,
  reserveWhatsAppSendCredit,
  refundWhatsAppSendCredit,
  recordWhatsAppSend,
};
