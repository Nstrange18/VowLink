# RSVP consistency and rollback

Production uses `mongoose.connection.transaction()` with snapshot reads and majority writes.
RSVP persistence and the derived invitation flag share the same session. Emails run only
after commit. Duplicate-key recovery starts a fresh transaction and reloads the owner's
deadline. The invitation revision increments to serialize concurrent writes and repairs.
The existing partial unique `currentKey_1` index must remain installed.

Only `NODE_ENV=development` with a loopback MongoDB host and a verified standalone
`hello` response uses a fallback. Replica sets, Atlas, production, staging, test, and
unspecified environments always require transactions. Transaction errors never enable
the fallback. Use a local replica set when testing production transaction behavior.

Standalone development submissions are serialized per invitation within this process.
The flag is saved first, restored if the RSVP write fails, and no email runs on failure.
This is not crash-safe or safe across multiple development processes; an unknown database
acknowledgement or failed compensation may need flag reconciliation. Do not use it in production.

`reconcileRsvpFlag(invitationId)` in `services/rsvpPersistence.js` is explicit maintenance
support, not an HTTP endpoint or scheduled job. It repairs only the derived flag/revision,
is independent of deadlines, and does not edit RSVPs, send email, or touch WhatsApp data.
Run only against explicitly reviewed invitation IDs after a mismatch audit. No repair has
been run as part of implementing this service.

No legacy deletion, currentKey backfill, or headcount backfill is required. Readers keep
the current selection rules: keyed response first, then updatedAt/createdAt/_id descending.
Historical duplicates and original RSVP IDs are retained.

Rollback to a version that retains the transaction writer, canonical readers, and index.
Do not roll back to the original create-on-every-submission route while accepting writes.
If unavoidable, pause RSVP submissions first; keep the index, audit unkeyed records created
during rollback, and review their relationship to canonical records before redeploying.
Automatic promotion of a newer unkeyed record could override a legitimate answer, so it
is intentionally not performed. Never drop the currentKey index as a rollback step.

Before deployment, verify the partial unique index and run the suite against an isolated
replica-set test database as well as mocked regression tests. No production migration or
automatic repair is run on startup. Existing independent plan-limit races across different
invitations and duplicate email notifications from distinct successful requests remain
separate limitations; transaction retries themselves do not send duplicate emails.
