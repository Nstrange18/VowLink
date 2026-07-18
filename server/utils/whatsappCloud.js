const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
const DEFAULT_TEMPLATE_NAME = "vowlink_invitation";
const DEFAULT_LANGUAGE_CODE = "en";

const getWhatsAppConfigStatus = () => {
  const phoneNumberId = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const businessAccountId = Boolean(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
  const accessToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  const webhookVerifyToken = Boolean(process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN);

  return {
    configured: phoneNumberId && businessAccountId && accessToken,
    phoneNumberId,
    businessAccountId,
    accessToken,
    webhookVerifyToken,
    templateName: process.env.WHATSAPP_INVITE_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME,
    languageCode: process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_LANGUAGE_CODE,
  };
};

const isWhatsAppCloudConfigured = () => getWhatsAppConfigStatus().configured;

const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[\s+\-()]/g, "");
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = `234${cleaned.slice(1)}`;
  }
  if (cleaned.length < 7 || !/^\d+$/.test(cleaned)) {
    return "";
  }
  return cleaned;
};

const parseCloudApiError = async (response) => {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const metaMessage = payload?.error?.message;
  const metaDetails = payload?.error?.error_data?.details;
  return metaDetails || metaMessage || `WhatsApp Cloud API request failed with status ${response.status}`;
};

const buildInvitationTemplatePayload = ({
  to,
  guestName,
  inviteLink,
  templateName,
  languageCode,
}) => ({
  messaging_product: "whatsapp",
  to,
  type: "template",
  template: {
    name: templateName || process.env.WHATSAPP_INVITE_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME,
    language: {
      code: languageCode || process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_LANGUAGE_CODE,
    },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: guestName || "Guest" },
          { type: "text", text: inviteLink || "" },
        ],
      },
    ],
  },
});

const sendInvitationTemplate = async ({ to, guestName, coupleNames, inviteLink }) => {
  const status = getWhatsAppConfigStatus();
  if (!status.configured) {
    throw new Error("WhatsApp Cloud API is not configured.");
  }

  const normalizedPhone = normalizeWhatsAppPhone(to);
  if (!normalizedPhone) {
    throw new Error("Guest phone number is missing or invalid.");
  }

  const payload = buildInvitationTemplatePayload({
    to: normalizedPhone,
    guestName,
    inviteLink,
    templateName: status.templateName,
    languageCode: status.languageCode,
  });

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(await parseCloudApiError(response));
  }

  const data = await response.json();
  return {
    messageId: data?.messages?.[0]?.id || "",
    response: data,
  };
};

module.exports = {
  getWhatsAppConfigStatus,
  isWhatsAppCloudConfigured,
  normalizeWhatsAppPhone,
  sendInvitationTemplate,
};
