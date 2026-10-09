const Invitation = require("../models/Invitation");
const RSVP = require("../models/RSVP");
const User = require("../models/User");
const Reminder = require("../models/WhatsAppReminder");
const { reserveWhatsAppSendCredit, refundWhatsAppSendCredit } = require("../utils/whatsappCredits");
const { buildReminderPayload, sendReminderTemplate } = require("../utils/whatsappReminderCloud");
const { getSendDiagnostics } = require("../utils/whatsappSendDiagnostics");
const { classifyDeliveryFailure, failureMessages } = require("../utils/whatsappDelivery");
const { isWhatsAppCloudConfigured } = require("../utils/whatsappCloud");

const fail = (status, message) => Object.assign(new Error(message), { status });
const assertPending = async (userId, invitationId) => {
  const invitation = await Invitation.findOne({ _id: invitationId, userId });
  if (!invitation) throw fail(404, "Invitation not found.");
  if (invitation.hasRSVPed || await RSVP.exists({ invitationId })) {
    throw fail(409, "This guest has already RSVP’d.");
  }
  return invitation;
};
const getOwner = async (userId) => {
  const owner = await User.findById(userId);
  if (!owner || owner.tier !== "pro") throw fail(403, "WhatsApp reminders are available on Pro.");
  if (!owner.rsvpDeadline || new Date(owner.rsvpDeadline) <= new Date() ||
      (owner.weddingDate && new Date(owner.weddingDate) <= new Date())) {
    throw fail(409, "Set a future RSVP deadline before sending reminders.");
  }
  return owner;
};
const payloadFor = (invitation, owner) => buildReminderPayload({
  to: invitation.phoneNumber, guestName: invitation.guestName,
  coupleNames: `${owner.partner1Name} and ${owner.partner2Name}`,
  deadline: owner.rsvpDeadline, slug: invitation.slug,
});

const sendManualReminder = async ({ userId, invitationId, requestKey }) => {
  const owner = await getOwner(userId);
  const invitation = await assertPending(userId, invitationId);
  if (!isWhatsAppCloudConfigured()) throw fail(503, "WhatsApp sending is not ready yet.");
  try { payloadFor(invitation, owner); } catch { throw fail(400, "Check the guest phone number and invitation link."); }
  const existing = await Reminder.findOne({ userId, invitationId, requestKey });
  if (existing) return existing;
  // Do not dispatch until MongoDB has installed the uniqueness constraints.
  await Reminder.init();
  const lockKey = `${userId}:${invitationId}`;
  // Accepted reminders have a 24-hour cooldown. Ambiguous/in-progress sends stay locked.
  await Reminder.updateMany({ lockKey, sendStatus: "accepted", lockUntil: { $lte: new Date() } }, { $unset: { lockKey: 1 } });
  let record;
  try {
    record = await Reminder.create({ userId, invitationId, requestKey, lockKey, rsvpDeadline: owner.rsvpDeadline });
  } catch (error) {
    if (error.code === 11000) throw fail(409, "A reminder is already in progress or was sent recently. Refresh reminder history before trying again.");
    throw error;
  }
  let reserved = false;
  let accepted = false;
  let reservationCompleted = false;
  try {
    const credit = await reserveWhatsAppSendCredit(userId, { atomic: true });
    reservationCompleted = true;
    if (!credit.reserved) throw fail(402, "No WhatsApp sends remain, or Pro access is no longer active.");
    reserved = true;
    record.creditState = "reserved";
    await record.save();
    record.sendStatus = "sending";
    await record.save();
    // Perform no database writes between this final eligibility check and dispatch.
    const freshOwner = await getOwner(userId);
    if (new Date(freshOwner.rsvpDeadline).getTime() !== new Date(record.rsvpDeadline).getTime()) {
      throw fail(409, "The RSVP deadline changed. Review it before sending a reminder.");
    }
    const freshInvitation = await assertPending(userId, invitationId);
    const payload = payloadFor(freshInvitation, freshOwner);
    const result = await sendReminderTemplate(payload);
    accepted = true;
    record.whatsappMessageId = result.messageId;
    record.sendStatus = "accepted";
    record.deliveryStatus = "queued";
    record.creditState = "consumed";
    record.submittedAt = new Date();
    record.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await record.save();
    return record;
  } catch (error) {
    const diagnostic = getSendDiagnostics(error, accepted);
    const uncertain = !reservationCompleted || accepted || ["no_http_response", "application_after_meta_http_response"].includes(diagnostic.failureSource);
    console.error("[WHATSAPP REMINDER] Send failed.", diagnostic);
    if (accepted) {
      // A local save failure cannot undo known Meta acceptance or refund its credit.
      record.sendStatus = "accepted";
      record.creditState = "consumed";
      record.failureReason = "WhatsApp accepted the reminder, but local processing encountered an error.";
    } else if (uncertain) {
      record.sendStatus = "unknown";
      record.creditState = !reservationCompleted ? "unknown" : reserved ? "reserved" : "none";
      record.failureReason = "Submission status is unknown. Do not retry; contact support to reconcile this send.";
    } else {
      if (reserved) {
        try { await refundWhatsAppSendCredit(userId, { atomic: true }); }
        catch {
          record.sendStatus = "unknown";
          record.creditState = "unknown";
          record.failureReason = "Credit refund status is unknown. Contact support before retrying.";
          await record.save();
          return record;
        }
        record.creditState = "refunded";
      }
      record.sendStatus = error.status ? "skipped" : "failed";
      record.deliveryStatus = "technical_failure";
      record.failedAt = new Date();
      record.failureReason = error.status ? error.message : failureMessages.technical_failure;
      record.lockKey = undefined;
    }
    await record.save();
    if (error.status) throw error;
    return record;
  }
};

const applyReminderWebhook = async (messageId, status, reason) => {
  if (typeof messageId !== "string" || !messageId) return false;
  const record = await Reminder.findOne({ whatsappMessageId: messageId });
  if (!record) return false;
  if (!["sent", "delivered", "read", "failed"].includes(status)) return true;
  const deliveryStatus = status === "failed" ? classifyDeliveryFailure(reason) : status;
  const changes = { deliveryStatus };
  if (status === "sent") changes.submittedAt = record.submittedAt || new Date();
  if (status === "delivered") changes.deliveredAt = new Date();
  if (status === "read") changes.readAt = new Date();
  if (status === "failed") {
    changes.failedAt = new Date();
    changes.failureReason = failureMessages[deliveryStatus];
  } else changes.failureReason = "";
  const protectedStates = status === "read" ? [] : status === "delivered" ? ["read"] : ["read", "delivered"];
  await Reminder.updateOne({ _id: record._id, deliveryStatus: { $nin: protectedStates } }, { $set: changes });
  return true;
};
module.exports = { sendManualReminder, applyReminderWebhook };
