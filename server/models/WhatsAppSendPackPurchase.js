const mongoose = require("mongoose");

const whatsAppSendPackPurchaseSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    packId: {
      type: String,
      required: true,
      trim: true,
    },
    sends: {
      type: Number,
      required: true,
      min: 1,
    },
    amountInNgn: {
      type: Number,
      required: true,
      min: 0,
    },
    provider: {
      type: String,
      default: "paystack",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("WhatsAppSendPackPurchase", whatsAppSendPackPurchaseSchema);
