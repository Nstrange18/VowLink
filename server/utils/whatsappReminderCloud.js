const { getWhatsAppConfigStatus, normalizeWhatsAppPhone } = require("./whatsappCloud");
const { metaDiagnostics, retainDiagnostics } = require("./whatsappSendDiagnostics");

const buildReminderPayload = ({ to, guestName, coupleNames, deadline, slug }) => {
  const phone = normalizeWhatsAppPhone(to);
  if (!phone || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug) || !/[a-z0-9]/.test(slug)) {
    throw new Error("Invalid reminder recipient or invitation link.");
  }
  const date = new Date(deadline);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid RSVP deadline.");
  return {
    messaging_product: "whatsapp", to: phone, type: "template",
    template: {
      name: "vowlink_rsvp_reminder", language: { code: "en" },
      components: [
        { type: "body", parameters: [
          { type: "text", parameter_name: "guest_name", text: guestName },
          { type: "text", parameter_name: "couple_names", text: coupleNames },
          { type: "text", parameter_name: "rsvp_deadline", text: date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) },
        ] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: slug }] },
      ],
    },
  };
};

const sendReminderTemplate = async (payload) => {
  if (!getWhatsAppConfigStatus().configured) throw new Error("WhatsApp is not configured.");
  let response;
  try {
    response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0"}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw retainDiagnostics(error, { failureSource: "no_http_response", metaMessage: "No HTTP response received; delivery to Meta is unknown." });
  }
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const privateValues = [payload.to, ...payload.template.components[0].parameters.flatMap((p) => [p.text, ...String(p.text).split(" and ")]), payload.template.components[1].parameters[0].text];
    throw retainDiagnostics(new Error("Meta rejected RSVP reminder."), metaDiagnostics(response, data, privateValues));
  }
  if (typeof data?.messages?.[0]?.id !== "string" || !data.messages[0].id.trim()) {
    throw retainDiagnostics(new Error("Missing Meta message ID."), { failureSource: "application_after_meta_http_response", httpStatus: response.status, metaMessage: "Send acceptance is unknown." });
  }
  return { messageId: data.messages[0].id };
};
module.exports = { buildReminderPayload, sendReminderTemplate };
