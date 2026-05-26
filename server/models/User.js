const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    partner1Name: { type: String, required: true, trim: true },
    partner2Name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    weddingDate: { type: Date, default: null },
    rsvpDeadline: { type: Date, default: null },
    venue: { type: String, trim: true, default: '' },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
