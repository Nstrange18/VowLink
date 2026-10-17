const Invitation = require("../models/Invitation");
const RSVP = require("../models/RSVP");
const User = require("../models/User");
const { findCurrentRsvp } = require("../utils/rsvpState");
const { runRsvpTransaction } = require("../utils/rsvpTransactions");
const CLOSED_MESSAGE = "RSVP is now closed. Please contact the couple.";
const fail = (status, message) => Object.assign(new Error(message), { status });
const assertDeadlineOpen = (deadline) => {
  if (deadline == null) return;
  const cutoff = new Date(deadline).getTime();
  if (!Number.isFinite(cutoff) || Date.now() > cutoff) throw fail(403, CLOSED_MESSAGE);
};

const persistRsvp = async ({ invitationId, values }) => {
  await RSVP.init();
  // A duplicate-key error aborts its transaction. Retry in a NEW transaction.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await runRsvpTransaction(invitationId, async (session) => {
        const options = session ? { session } : {};
        const invitation = await Invitation.findById(invitationId).session(session);
        if (!invitation) throw fail(404, "Invitation not found.");
        const owner = await User.findById(invitation.userId?._id || invitation.userId).select("rsvpDeadline tier plusOnePolicy").session(session);
        if (!owner) throw fail(404, "Invitation not found.");
        if ((owner.tier || "unpaid") === "unpaid") throw fail(403, "This wedding workspace is not active yet.");
        assertDeadlineOpen(owner.rsvpDeadline);
        const maximum = owner.plusOnePolicy === "plus_one_allowed" ? Math.min((invitation.allowedGuests || 1) + 1, 10) : invitation.allowedGuests || 1;
        if (values.attending === "Yes" && values.numberOfGuests > maximum) throw fail(400, "Confirmed guest count must be within your invitation allowance.");
        const existing = await findCurrentRsvp(invitationId, session);
        const previousFlag = invitation.hasRSVPed === true;
        // Lock the invitation first: parallel edits/repairs contend on this document.
        const flag = await Invitation.updateOne({ _id: invitationId }, { $set: { hasRSVPed: true }, $inc: { rsvpRevision: 1 } }, options);
        if (flag.matchedCount !== 1) throw fail(404, "Invitation not found.");
        try {
          assertDeadlineOpen(owner.rsvpDeadline);
          const rsvp = await RSVP.findOneAndUpdate(existing ? { _id: existing._id } : { currentKey: String(invitationId) },
            { $set: values }, { ...options, upsert: !existing, new: true, runValidators: true, setDefaultsOnInsert: true });
          if (!rsvp) throw new Error("Could not store RSVP.");
          return rsvp;
        } catch (error) {
          if (!session) {
            // Development standalone only. A crash/unknown acknowledgement still needs repair.
            await Invitation.updateOne({ _id: invitationId }, { $set: { hasRSVPed: previousFlag } });
          }
          throw error;
        }
      });
    } catch (error) {
      if (error.code !== 11000 || attempt === 1) throw error;
    }
  }
};

// Explicit maintenance helper, not a route or startup job. No messages or RSVP edits.
const reconcileRsvpFlag = (invitationId) => runRsvpTransaction(invitationId, async (session) => {
  const invitation = await Invitation.findById(invitationId).session(session);
  if (!invitation) return { found: false, repaired: false };
  const hasRSVPed = Boolean(await findCurrentRsvp(invitationId, session));
  if (invitation.hasRSVPed === hasRSVPed) return { found: true, repaired: false, hasRSVPed };
  const result = await Invitation.updateOne({ _id: invitationId, hasRSVPed: { $ne: hasRSVPed } },
    { $set: { hasRSVPed }, $inc: { rsvpRevision: 1 } }, session ? { session } : {});
  return { found: true, repaired: result.modifiedCount === 1, hasRSVPed };
});
module.exports = { persistRsvp, reconcileRsvpFlag, assertDeadlineOpen, CLOSED_MESSAGE };
