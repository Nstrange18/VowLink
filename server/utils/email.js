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

// ── 3. Honeymoon Target Reached Alert ──────────────────────────────────────────
const sendHoneymoonGoalReachedNotification = async ({ coupleEmail, coupleName, targetAmount, currentAmount }) => {
  if (!process.env.SENDGRID_API_KEY || !coupleEmail) return;

  const formattedTarget = targetAmount.toLocaleString();
  const formattedCurrent = currentAmount.toLocaleString();

  const body = `
    <h2 style="margin:0 0 8px 0;color:#D8B76A;font-size:22px;font-weight:400;">Honeymoon Fund Target Reached! 🎉</h2>
    <p style="margin:0 0 24px 0;color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;">Congratulations, ${coupleName}!</p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:25px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 12px 0;color:rgba(255,255,255,0.9);font-size:18px;font-family:sans-serif;">
        Your Honeymoon Cash Fund has hit its target goal!
      </p>
      <div style="font-size:36px;color:#34D399;font-weight:700;margin:16px 0;font-family:sans-serif;">
        ${formattedCurrent} / ${formattedTarget}
      </div>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;font-family:sans-serif;">
        Amazing news! Your total honeymoon cash fund contributions have reached or exceeded your target of <strong style="color:#D8B76A;">${formattedTarget}</strong>.
      </p>
    </div>

    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:0;">Log in to your VowLink settings page to manage registry preferences.</p>
  `;

  try {
    await sgMail.send({
      to: coupleEmail,
      from: FROM_EMAIL,
      subject: `🎉 VowLink Alert: Your Honeymoon Fund Target has been reached!`,
      html: wrapEmail(body),
    });
    console.log(`📧 Honeymoon fund target alert sent to ${coupleEmail}`);
  } catch (err) {
    console.error("❌ SendGrid honeymoon target alert error:", err.response?.body || err.message);
  }
};

// ── 4. Wedding Day Congratulations Email ──────────────────────────────────────
const sendWeddingDayCongratulationsEmail = async ({ coupleEmail, coupleName }) => {
  if (!process.env.SENDGRID_API_KEY || !coupleEmail) return;

  const body = `
    <h2 style="margin:0 0 8px 0;color:#D8B76A;font-size:24px;font-weight:400;text-align:center;">Happy Wedding Day! 💍🎉</h2>
    <p style="margin:0 0 24px 0;color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;text-align:center;">${coupleName}</p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:30px;margin-bottom:20px;text-align:center;line-height:1.6;">
      <p style="margin:0 0 16px 0;color:#fff;font-size:18px;font-family:sans-serif;font-weight:300;">
        Today is the big day you've been planning for!
      </p>
      <p style="margin:0 0 20px 0;color:rgba(255,255,255,0.7);font-size:14px;font-family:sans-serif;">
        On behalf of the VowLink team, we wish you a gorgeous, magical wedding day filled with love, laughter, and unforgettable moments. May your marriage be a lifetime of happiness, understanding, and shared dreams.
      </p>
      <div style="font-size:48px;margin:20px 0;">✨ 🥂 🤵‍♂️ ❤️ 👰‍♀️ ✨</div>
    </div>

    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:0;text-align:center;">
      Thank you for letting VowLink be a part of your love story.
    </p>
  `;

  try {
    await sgMail.send({
      to: coupleEmail,
      from: FROM_EMAIL,
      subject: `💍 Happy Wedding Day, ${coupleName}! 🎉`,
      html: wrapEmail(body),
    });
    console.log(`📧 Wedding day congratulations email sent to ${coupleEmail}`);
  } catch (err) {
    console.error("❌ SendGrid wedding day congratulations email error:", err.response?.body || err.message);
  }
};

// ── 5. New Venue Registration Alert to Admin ───────────────────────────────
const sendNewVenueRegistrationAdminAlert = async (venue) => {
  const adminEmail = "nwubachukwuemelie@gmail.com";
  if (!process.env.SENDGRID_API_KEY) return;

  const formatBool = (val) => (val ? "✔️ Yes" : "❌ No");

  const body = `
    <h2 style="margin:0 0 8px 0;color:#D8B76A;font-size:22px;font-weight:400;text-align:center;">New Venue Registration Alert 🏛️</h2>
    <p style="margin:0 0 24px 0;color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;text-align:center;">VowLink Administrator Notification</p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px;line-height:1.6;color:rgba(255,255,255,0.9);font-family:sans-serif;font-size:14px;">
      <h3 style="margin:0 0 12px 0;color:#D8B76A;font-size:16px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;">🏛️ General Specifications</h3>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Venue Name:</strong> ${venue.name}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Style Category:</strong> ${venue.style}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Owner Email:</strong> ${venue.ownerEmail}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Contact Phone:</strong> ${venue.phone}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">WhatsApp:</strong> ${venue.whatsapp}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">City:</strong> ${venue.city}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">General Location:</strong> ${venue.generalLocation}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Full Address:</strong> ${venue.fullAddress}</p>
      <p style="margin:0 0 16px 0;"><strong style="color:#fff;">Price Range:</strong> ${venue.priceRange}</p>

      <h3 style="margin:0 0 12px 0;color:#D8B76A;font-size:16px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px;">🛡️ Declared Trust & Safety Items</h3>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Fire Exits & Signage:</strong> ${formatBool(venue.claimedFireExits)}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Full CCTV Coverage:</strong> ${formatBool(venue.claimedCctv)}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Guard Security Personnel:</strong> ${formatBool(venue.claimedSecurity)}</p>
      <p style="margin:0 0 8px 0;"><strong style="color:#fff;">Structural Integrity:</strong> ${formatBool(venue.claimedStructural)}</p>
      <p style="margin:0;"><strong style="color:#fff;">Venue Liability Insurance:</strong> ${formatBool(venue.claimedInsurance)}</p>
    </div>

    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:0;text-align:center;">
      This venue is currently set as pending approval. Please review and verify their details in the Super Admin panel.
    </p>
  `;

  try {
    await sgMail.send({
      to: adminEmail,
      from: FROM_EMAIL,
      subject: `🏛️ VowLink Alerts: New Venue Account Created — ${venue.name}`,
      html: wrapEmail(body),
    });
    console.log(`📧 Admin venue registration alert sent to ${adminEmail}`);
  } catch (err) {
    console.error("❌ SendGrid admin venue registration alert error:", err.response?.body || err.message);
  }
};

// ── 6. Couple RSVP Limit Reached Alert ──────────────────────────────────────────
const sendRsvpLimitReachedAlert = async ({ coupleEmail, coupleName, tier, limit }) => {
  if (!process.env.SENDGRID_API_KEY || !coupleEmail) return;

  const body = `
    <h2 style="margin:0 0 8px 0;color:#F87171;font-size:22px;font-weight:400;">RSVP Limit Reached ⚠️</h2>
    <p style="margin:0 0 24px 0;color:rgba(255,255,255,0.5);font-size:14px;font-family:sans-serif;">${coupleName}</p>

    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:25px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 12px 0;color:rgba(255,255,255,0.9);font-size:16px;font-family:sans-serif;">
        Your wedding invitation RSVP list is now full.
      </p>
      <div style="font-size:48px;color:#F87171;font-weight:700;margin:16px 0;font-family:sans-serif;">
        ${limit} / ${limit}
      </div>
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;font-family:sans-serif;">
        You have reached the maximum limit of <strong style="color:#fff;">${limit} RSVPs</strong> permitted under your <strong style="color:#D8B76A;">${tier.toUpperCase()} plan</strong>.
      </p>
      <p style="margin:16px 0 0 0;color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;font-family:sans-serif;">
        Any subsequent guests attempting to RSVP to your wedding invitations will be blocked and advised that the limit is reached.
      </p>
    </div>

    <div style="text-align:center;margin:32px 0 20px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/billing" style="display:inline-block;background:linear-gradient(135deg,#D8B76A 0%,#F2D894 100%);color:#070A13;text-decoration:none;font-weight:600;padding:14px 32px;border-radius:999px;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 8px 24px rgba(216,183,106,0.25);">
        Upgrade Plan Now
      </a>
    </div>

    <p style="color:rgba(255,255,255,0.4);font-size:12px;font-family:sans-serif;margin:0;text-align:center;">Log in to your VowLink dashboard to manage RSVP lists.</p>
  `;

  try {
    await sgMail.send({
      to: coupleEmail,
      from: FROM_EMAIL,
      subject: `⚠️ VowLink Alert: Your RSVP limit has been reached! (${tier.toUpperCase()} Plan)`,
      html: wrapEmail(body),
    });
    console.log(`📧 RSVP limit reached alert sent to ${coupleEmail}`);
  } catch (err) {
    console.error("❌ SendGrid RSVP limit reached alert error:", err.response?.body || err.message);
  }
};

module.exports = {
  sendRsvpCoupleAlert,
  sendRsvpGuestConfirmation,
  sendHoneymoonGoalReachedNotification,
  sendWeddingDayCongratulationsEmail,
  sendNewVenueRegistrationAdminAlert,
  sendRsvpLimitReachedAlert
};
