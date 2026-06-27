const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    guestName: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    greeting: {
      type: String,
      required: true,
      trim: true,
    },

    customMessage: {
      type: String,
      required: true,
      trim: true,
    },

    allowedGuests: {
      type: Number,
      default: 1,
      min: 1,
    },

    category: {
      type: String,
      trim: true,
      default: "Guest",
    },

    hasRSVPed: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    senderGroup: {
      type: String,
      enum: ["bride", "groom", "both", "general"],
      default: "general",
      trim: true,
    },
    createdByPartner: {
      type: String,
      enum: ["bride", "groom", "both", "general"],
      default: "general",
      trim: true,
    },
    whatsappStatus: {
      type: String,
      enum: ["not_sent", "ready", "sent", "missing_number"],
      default: function () {
        return this.phoneNumber ? "not_sent" : "missing_number";
      },
      trim: true,
    },
    whatsappSentAt: {
      type: Date,
    },
    whatsappSentBy: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);