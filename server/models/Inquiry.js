const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "inspection_booked", "replied", "unavailable", "booked_elsewhere", "archived"],
      default: "new",
      index: true,
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            enum: ["new", "contacted", "inspection_booked", "replied", "unavailable", "booked_elsewhere", "archived"],
            default: "new",
          },
          label: { type: String, default: "", trim: true },
          actorRole: {
            type: String,
            enum: ["venue", "admin", "system"],
            default: "system",
          },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    lastReminderAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
