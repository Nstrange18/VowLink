const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true, // Amount in NGN
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gift", giftSchema);
