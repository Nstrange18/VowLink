const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    generalLocation: { type: String, required: true, trim: true }, // e.g. "Lekki, Lagos"
    fullAddress: { type: String, required: true, trim: true },
    capacity: { type: String, required: true, trim: true }, // e.g. "300-500 guests"
    priceRange: { type: String, required: true, trim: true }, // e.g. "₦500k - ₦1.2M"
    description: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    mapLink: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] }, // Array of photo URLs or base64 data
    isFeatured: { type: Boolean, default: false },
    style: {
      type: String,
      enum: ["Classic", "Modern", "Beach", "Rustic", "Garden"],
      default: "Classic",
      trim: true,
    },
    // Owner Authentication
    ownerEmail: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    ownerPassword: {
      type: String,
    },
    // Contact Info & Metadata
    email: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    // Subscription Details
    subscriptionTier: {
      type: String,
      enum: ["basic", "listed", "featured"],
      default: "basic",
    },
    subscriptionExpiry: {
      type: Date,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    inquiries: {
      type: Number,
      default: 0,
    },
    safetyFireExits: { type: Boolean, default: false },
    safetyCctv: { type: Boolean, default: false },
    safetySecurity: { type: Boolean, default: false },
    safetyStructural: { type: Boolean, default: false },
    safetyInsurance: { type: Boolean, default: false },
    trustScore: { type: Number, default: 9.0 },
  },
  { timestamps: true }
);

// Encrypt ownerPassword before saving
venueSchema.pre("save", async function () {
  if (!this.isModified("ownerPassword") || !this.ownerPassword) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.ownerPassword = await bcrypt.hash(this.ownerPassword, salt);
});

// Compare password method
venueSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.ownerPassword) return false;
  return await bcrypt.compare(enteredPassword, this.ownerPassword);
};

module.exports = mongoose.model("Venue", venueSchema);
