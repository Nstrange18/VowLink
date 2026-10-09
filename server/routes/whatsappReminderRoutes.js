const express = require("express");
const mongoose = require("mongoose");
const { protect } = require("../middleware/auth");
const Reminder = require("../models/WhatsAppReminder");
const { sendManualReminder } = require("../services/whatsappReminders");

const publicRecord = (record) => ({
  id: String(record._id), invitationId: String(record.invitationId?._id || record.invitationId),
  guestName: record.invitationId?.guestName,
  trigger: record.trigger, templateName: record.templateName,
  messageId: record.whatsappMessageId, sendStatus: record.sendStatus,
  deliveryStatus: record.deliveryStatus, failureReason: record.failureReason,
  rsvpDeadline: record.rsvpDeadline, creditState: record.creditState,
  createdAt: record.createdAt, submittedAt: record.submittedAt,
  deliveredAt: record.deliveredAt, readAt: record.readAt, failedAt: record.failedAt,
  retryAfter: record.lockUntil,
});

module.exports = (requireProWorkspace) => {
  const router = express.Router();
  router.use(protect, requireProWorkspace);
  const validate = (req, res, next) => {
    const key = req.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9_-]{16,100}$/.test(key)) return res.status(400).json({ message: "A valid reminder request key is required." });
    req.reminderKey = key;
    return next();
  };
  const send = (req, id) => sendManualReminder({ userId: req.user.id, invitationId: id, requestKey: req.reminderKey });
  router.post("/send/:id", validate, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid invitation ID." });
    try { return res.json({ data: publicRecord(await send(req, req.params.id)) }); }
    catch (error) { return res.status(error.status || 500).json({ message: error.status ? error.message : "Could not submit RSVP reminder. Refresh history before trying again." }); }
  });
  router.post("/send-bulk", validate, async (req, res) => {
    const ids = req.body?.invitationIds;
    if (!Array.isArray(ids) || !ids.length || ids.length > 100 || !ids.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: "Select between 1 and 100 valid invitations." });
    }
    const results = [];
    for (const id of [...new Set(ids.map(String))]) {
      try { results.push({ id, data: publicRecord(await send(req, id)) }); }
      catch (error) { results.push({ id, status: "skipped", message: error.status ? error.message : "Could not submit reminder. Refresh history before trying again." }); }
    }
    return res.json({ results });
  });
  router.get("/history", async (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
      const records = await Reminder.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(limit).populate("invitationId", "guestName").lean();
      return res.json({ history: records.map(publicRecord) });
    } catch { return res.status(500).json({ message: "Could not load RSVP reminder history." }); }
  });
  return router;
};
