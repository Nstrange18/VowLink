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
    receptionLocation: { type: String, trim: true, default: "" },
    weddingColors: { type: [String], default: [] },
    dressCode: { type: String, trim: true, default: "" }, // e.g. "Black Tie", "Smart Casual"
    plusOnePolicy: {
      type: String,
      enum: ["invitation_only", "plus_one_allowed"],
      default: "invitation_only",
      trim: true,
    },
    kidsAllowed: { type: Boolean, default: true },
    tier: {
      type: String,
      enum: ["free", "plus", "pro"],
      default: "free",
      trim: true,
    },
    galleryPhotos: {
      type: [String],
      default: [],
    },
    cardTheme: {
      type: String,
      default: "floral",
      trim: true,
    },
    customCardBg: {
      type: String,
      default: "",
    },
    pageBgTemplate: {
      type: String,
      default: "",
    },
    customTextColor: {
      type: String,
      default: "#1A2E4A",
      trim: true,
    },
    customFontFamily: {
      type: String,
      default: "classic",
      trim: true,
    },
    customVerticalOffset: {
      type: Number,
      default: 0,
    },
    customTextSize: {
      type: Number,
      default: 1.0,
    },
    couplePhotoUrl: {
      type: String,
      default: "",
    },
    coupleOverlayOpacity: {
      type: Number,
      default: 0.45,
    },
    musicUrl: {
      type: String,
      default: "",
      trim: true,
    },
    shortlistedVenues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Venue",
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    customTextAlign: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    customHorizontalOffset: {
      type: Number,
      default: 0,
    },
    smartLayoutEnabled: {
      type: Boolean,
      default: true,
    },
    registryEnabled: {
      type: Boolean,
      default: false,
    },
    registryBankName: {
      type: String,
      default: "",
      trim: true,
    },
    registryAccountName: {
      type: String,
      default: "",
      trim: true,
    },
    registryAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    registryNotes: {
      type: String,
      default: "",
      trim: true,
    },
    honeymoonFundTarget: {
      type: Number,
      default: 0,
    },
    honeymoonFundCurrent: {
      type: Number,
      default: 0,
    },
    weddingEmailSent: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
