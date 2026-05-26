const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema(
  {
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    attending: { type: String, enum: ["Yes", "No"], required: true },
    numberOfGuests: { type: Number, default: 1, min: 0 },
    mealPreference: {
      type: String,
      enum: ["No Preference", "Chicken", "Fish", "Vegetarian", "Vegan"],
      default: "No Preference",
    },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RSVP", rsvpSchema);