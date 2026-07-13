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
    checkInToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    checkedInVia: {
      type: String,
      enum: ["pin", "couple", "admin", "unknown"],
      default: "unknown",
    },
    checkInHistory: [
      {
        action: {
          type: String,
          enum: ["checked_in", "reset"],
          required: true,
        },
        at: {
          type: Date,
          default: Date.now,
        },
        via: {
          type: String,
          enum: ["pin", "couple", "admin", "unknown"],
          default: "unknown",
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);
