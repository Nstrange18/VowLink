const mongoose = require("mongoose");

const rsvpSchema = new mongoose.Schema(
  {
    // Legacy records omit this key and remain untouched. New writes claim one current response.
    currentKey: { type: String },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, required: true, trim: true },
    attending: { type: String, enum: ["Yes", "No"], required: true },
    numberOfGuests: { type: Number, default: 1, min: 0 },
    headcountConfirmed: { type: Boolean, default: false },
    mealPreference: {
      type: String,
      enum: ["No Preference", "Chicken", "Fish", "Vegetarian", "Vegan"],
      default: "No Preference",
    },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

rsvpSchema.index({ currentKey: 1 }, { unique: true, partialFilterExpression: { currentKey: { $type: "string" } } });
module.exports = mongoose.model("RSVP", rsvpSchema);
