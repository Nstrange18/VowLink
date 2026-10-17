const RSVP = require("../models/RSVP");

const currentSort = { currentKey: -1, updatedAt: -1, createdAt: -1, _id: -1 };
const findCurrentRsvp = (invitationId, session) => {
  const query = RSVP.findOne({ invitationId }).sort(currentSort);
  return session === undefined ? query : query.session(session);
};
const hasCurrentRsvp = async (invitationId) => Boolean(await RSVP.exists({ invitationId }));
const checkInRsvpIssue = async (invitationId) => {
  const rsvp = await findCurrentRsvp(invitationId);
  if (!rsvp) return "This guest has not submitted their RSVP yet. Ask them to RSVP before checking them in.";
  if (rsvp.attending !== "Yes") return "This guest RSVP'd that they are not attending, so they cannot be checked in.";
  return "";
};
const currentRsvps = (records) => {
  const seen = new Set();
  return records.filter((record) => {
    const id = String(record.invitationId?._id || record.invitationId);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};
module.exports = { currentSort, findCurrentRsvp, currentRsvps, hasCurrentRsvp, checkInRsvpIssue };
