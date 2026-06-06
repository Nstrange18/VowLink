const sgMail = require("@sendgrid/mail");

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = "noreplybiru556@gmail.com";
const BRAND_NAME = "VowLink";

// ── Shared branded email wrapper ─────────────────────────────────────────────
const wrapEmail = (bodyHtml) => `
  <div style="font-family:'Georgia',serif;background:#070A13;margin:0;padding:32px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#0D1220;border-radius:20px;border:1px solid rgba(216,183,106,0.25);overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0D1220 0%,#1A2540 100%);padding:32px;text-align:center;border-bottom:1px solid rgba(216,183,106,0.2);">
        <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#D8B76A;">Wedding Platform</p>
        <h1 style="margin:0;font-size:28px;font-weight:400;color:#fff;letter-spacing:0.05em;">${BRAND_NAME}</h1>
      </div>
      <!-- Body -->
      <div style="padding:32px;">
        ${bodyHtml}
      </div>
      <!-- Footer -->
      <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);font-family:sans-serif;">
          Sent automatically by ${BRAND_NAME} &bull; Do not reply to this email
        </p>
      </div>
    </div>
  </div>
`;

// ── 1. Couple RSVP Alert ─────────────────────────────────────────────────────
// Sent to the couple when any guest RSVPs
const sendRsvpCoupleAlert = async ({ coupleEmail, coupleName, guestName, attending, guestCount, weddingDate }) => {
  if (!process.env.SENDGRID_API_KEY || !coupleEmail) return;

  const isAttending = attending === "Yes";
  const statusColor = isAttending ? "#34D399" : "#F87171";
  const statusText = isAttending ? "✓ Attending" : "✗ Declining";
  const formattedDate = weddingDate ? new Date(weddingDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  const body = `
    <h2 style="margin:0 0 8px 0;color:#D8B76A;font-size:22px;font-weight:400;">New RSVP Received 💌</h2>
    <p style="margin:0 0 24px 0;color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;">${coupleName}</p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px 0;color:rgba(255,255,255,0.9);font-size:16px;font-family:sans-serif;">
        <strong style="color:#fff;">${guestName}</strong> has responded to your invitation.
      </p>
      <p style="margin:0;display:inline-block;background:${isAttending ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"};color:${statusColor};border:1px solid ${statusColor}40;border-radius:999px;padding:6px 16px;font-size:13px;font-family:sans-serif;font-weight:600;">
        ${statusText}
      </p>
      ${isAttending && guestCount > 1 ? `<p style="margin:12px 0 0 0;color:rgba(255,255,255,0.5);font-size:13px;font-family:sans-serif;">Total party size: <strong style="color:#D8B76A;">${guestCount} guests</strong></p>` : ""}
    </div>

    ${formattedDate ? `<p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:0;">Wedding date: ${formattedDate}</p>` : ""}
    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:8px 0 0 0;">Log in to your VowLink dashboard to view all RSVPs.</p>
  `;

  try {
    await sgMail.send({
      to: coupleEmail,
      from: FROM_EMAIL,
      subject: `💌 ${guestName} just RSVPed to your wedding!`,
      html: wrapEmail(body),
    });
    console.log(`📧 RSVP couple alert sent to ${coupleEmail}`);
  } catch (err) {
    console.error("❌ SendGrid RSVP couple alert error:", err.response?.body || err.message);
  }
};

// ── 2. Guest RSVP Confirmation ───────────────────────────────────────────────
// Sent to the guest (only if guestEmail provided)
const sendRsvpGuestConfirmation = async ({ guestEmail, guestName, coupleName, attending, weddingDate, venue }) => {
  if (!process.env.SENDGRID_API_KEY || !guestEmail) return;

  const isAttending = attending === "Yes";
  const formattedDate = weddingDate ? new Date(weddingDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : null;

  const body = `
    <h2 style="margin:0 0 8px 0;color:#D8B76A;font-size:22px;font-weight:400;">RSVP Confirmed ✓</h2>
    <p style="margin:0 0 24px 0;color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;">Thank you, ${guestName}</p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 16px 0;color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;font-family:sans-serif;">
        ${isAttending
          ? `We've confirmed your attendance at <strong style="color:#D8B76A;">${coupleName}'s</strong> wedding. We look forward to celebrating with you!`
          : `We've recorded that you won't be able to attend <strong style="color:#D8B76A;">${coupleName}'s</strong> wedding. Thank you for letting us know.`
        }
      </p>
      ${formattedDate ? `
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;">
        <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-family:sans-serif;">Wedding Date</p>
        <p style="margin:0;color:#D8B76A;font-size:15px;">${formattedDate}</p>
      </div>` : ""}
      ${venue ? `
      <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;margin-top:16px;">
        <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-family:sans-serif;">Venue</p>
        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:15px;">${venue}</p>
      </div>` : ""}
    </div>

    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:0;">This is an automated confirmation from ${BRAND_NAME}.</p>
  `;

  try {
    await sgMail.send({
      to: guestEmail,
      from: FROM_EMAIL,
      subject: `RSVP Confirmed — ${coupleName}'s Wedding`,
      html: wrapEmail(body),
    });
    console.log(`📧 RSVP guest confirmation sent to ${guestEmail}`);
  } catch (err) {
    console.error("❌ SendGrid RSVP guest confirmation error:", err.response?.body || err.message);
  }
};

module.exports = { sendRsvpCoupleAlert, sendRsvpGuestConfirmation };
