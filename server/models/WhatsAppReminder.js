const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  trigger: { type: String, enum: ["manual"], default: "manual" },
  templateName: { type: String, default: "vowlink_rsvp_reminder" },
  requestKey: { type: String, required: true },
  // A unique persistent lock also protects against different request keys/double clicks.
  lockKey: { type: String },
  lockUntil: { type: Date },
  whatsappMessageId: { type: String, index: true },
  sendStatus: { type: String, enum: ["preparing", "sending", "accepted", "failed", "unknown", "skipped"], default: "preparing" },
  deliveryStatus: { type: String, enum: ["not_sent", "queued", "sent", "delivered", "read", "marketing_limited", "payment_issue", "technical_failure"], default: "not_sent" },
  failureReason: { type: String, default: "" },
  rsvpDeadline: { type: Date, required: true },
  creditState: { type: String, enum: ["none", "reserved", "consumed", "refunded", "unknown"], default: "none" },
  submittedAt: Date,
  deliveredAt: Date,
  readAt: Date,
  failedAt: Date,
}, { timestamps: true, autoIndex: true });
schema.index({ userId: 1, invitationId: 1, requestKey: 1 }, { unique: true });
schema.index({ lockKey: 1 }, { unique: true, partialFilterExpression: { lockKey: { $type: "string" } } });
module.exports = mongoose.model("WhatsAppReminder", schema);
