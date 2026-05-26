const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);