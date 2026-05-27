const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    partner1Name: { type: String, required: true, trim: true },
    partner2Name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    weddingDate: { type: Date, default: null },
    weddingTime: { type: String, default: "18:00" }, // HH:MM format
    rsvpDeadline: { type: Date, default: null },
    venue: { type: String, trim: true, default: "" },
    weddingColors: { type: [String], default: [] }, // e.g. ["#FFFFFF", "#D8B76A", "#1A2E4A"]
    dressCode: { type: String, trim: true, default: "" }, // e.g. "Black Tie", "Smart Casual"
    plusOnePolicy: {
      type: String,
      enum: ["invitation_only", "plus_one_allowed"],
      default: "invitation_only",
      trim: true,
    },
    kidsAllowed: { type: Boolean, default: true },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
