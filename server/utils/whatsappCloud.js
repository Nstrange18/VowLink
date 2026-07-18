const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
const DEFAULT_TEMPLATE_NAME = "vowlink_invitation";
const DEFAULT_LANGUAGE_CODE = "en";
const DEFAULT_GUEST_NAME_PARAMETER = "guest_name";
const DEFAULT_INVITE_MESSAGE_PARAMETER = "invite_message";
const DEFAULT_URL_BUTTON_INDEX = "0";
const DEFAULT_URL_BUTTON_VALUE_MODE = "full";

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
    guestNameParameter: process.env.WHATSAPP_GUEST_NAME_PARAMETER || DEFAULT_GUEST_NAME_PARAMETER,
    inviteMessageParameter:
      process.env.WHATSAPP_INVITE_MESSAGE_PARAMETER ||
      process.env.WHATSAPP_INVITE_LINK_PARAMETER ||
      DEFAULT_INVITE_MESSAGE_PARAMETER,
    urlButtonIndex: process.env.WHATSAPP_URL_BUTTON_INDEX || DEFAULT_URL_BUTTON_INDEX,
    urlButtonValueMode: process.env.WHATSAPP_URL_BUTTON_VALUE_MODE || DEFAULT_URL_BUTTON_VALUE_MODE,
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

const buildInviteMessage = (coupleNames) =>
  `you are specially invited to celebrate the wedding of ${coupleNames || "the couple"}.`;

const buildUrlButtonValue = (inviteLink, mode = DEFAULT_URL_BUTTON_VALUE_MODE) => {
  if (!inviteLink) return "";
  if (mode === "full") return inviteLink;

  try {
    const url = new URL(inviteLink);
    const cleanPath = url.pathname.replace(/^\/+/, "");
    if (mode === "path") return cleanPath;
    if (mode === "slug") return cleanPath.split("/").filter(Boolean).pop() || cleanPath;
  } catch {
    return inviteLink;
  }

  return inviteLink;
};

const buildInvitationTemplatePayload = ({
  to,
  guestName,
  inviteMessage,
  inviteLink,
  templateName,
  languageCode,
  guestNameParameter,
  inviteMessageParameter,
  urlButtonIndex,
  urlButtonValueMode,
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
          {
            type: "text",
            parameter_name: guestNameParameter || DEFAULT_GUEST_NAME_PARAMETER,
            text: guestName || "Guest",
          },
          {
            type: "text",
            parameter_name: inviteMessageParameter || DEFAULT_INVITE_MESSAGE_PARAMETER,
            text: inviteMessage || buildInviteMessage(),
          },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: String(urlButtonIndex || DEFAULT_URL_BUTTON_INDEX),
        parameters: [
          {
            type: "text",
            text: buildUrlButtonValue(inviteLink, urlButtonValueMode),
          },
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
    inviteMessage: buildInviteMessage(coupleNames),
    inviteLink,
    templateName: status.templateName,
    languageCode: status.languageCode,
    guestNameParameter: status.guestNameParameter,
    inviteMessageParameter: status.inviteMessageParameter,
    urlButtonIndex: status.urlButtonIndex,
    urlButtonValueMode: status.urlButtonValueMode,
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
