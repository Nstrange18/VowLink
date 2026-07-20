const mongoose = require("mongoose");

const whatsAppSendLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      required: true,
      index: true,
    },
    phoneHash: {
      type: String,
      required: true,
      index: true,
    },
    phoneLast4: {
      type: String,
      default: "",
      trim: true,
    },
    whatsappMessageId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["accepted", "refunded"],
      default: "accepted",
      index: true,
    },
    metadata: {
      guestName: { type: String, default: "", trim: true },
      provider: { type: String, default: "cloud_api", trim: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WhatsAppSendLedger", whatsAppSendLedgerSchema);
