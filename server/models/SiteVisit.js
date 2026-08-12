const mongoose = require("mongoose");

const siteVisitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, trim: true, index: true },
    sessionId: { type: String, trim: true, default: "", index: true },
    pageType: {
      type: String,
      enum: ["landing", "marketing", "invite", "check_in", "public", "unknown"],
      default: "unknown",
      index: true,
    },
    path: { type: String, required: true, trim: true, index: true },
    slug: { type: String, trim: true, default: "", index: true },
    referrer: { type: String, trim: true, default: "" },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
      index: true,
    },
    userAgent: { type: String, trim: true, default: "" },
    ipHash: { type: String, trim: true, default: "", index: true },
  },
  { timestamps: true },
);

siteVisitSchema.index({ createdAt: -1 });
siteVisitSchema.index({ path: 1, createdAt: -1 });

module.exports = mongoose.model("SiteVisit", siteVisitSchema);
