const { metaDiagnostics, retainDiagnostics } = require("./whatsappSendDiagnostics");
const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
const DEFAULT_TEMPLATE_NAME = "vowlink_invitation";
// Public image served from client/public for the approved image-header template.
const INVITATION_HEADER_IMAGE_URL = "https://vowlink.co/vowlink-logo.jpg";
const DEFAULT_LANGUAGE_CODE = "en";
const DEFAULT_GUEST_NAME_PARAMETER = "guest_name";
const DEFAULT_INVITE_MESSAGE_PARAMETER = "invite_message";
const DEFAULT_URL_BUTTON_INDEX = "0";
const DEFAULT_URL_BUTTON_VALUE_MODE = "slug";

const getUrlButtonValueMode = () => {
  const mode = String(process.env.WHATSAPP_URL_BUTTON_VALUE_MODE || DEFAULT_URL_BUTTON_VALUE_MODE).toLowerCase();
  return ["full", "path", "slug"].includes(mode) ? mode : DEFAULT_URL_BUTTON_VALUE_MODE;
};

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
    urlButtonValueMode: getUrlButtonValueMode(),
  };
};

const isWhatsAppCloudConfigured = () => getWhatsAppConfigStatus().configured;

const normalizeWhatsAppPhone = (phone) => {
  if (!phone) return "";
  const raw = String(phone).trim();
  let cleaned = raw.replace(/[\s+\-()]/g, "");
  if (raw.startsWith("00")) {
    cleaned = cleaned.replace(/^00/, "");
  }
  if (/^0\d{10}$/.test(cleaned)) {
    cleaned = `234${cleaned.slice(1)}`;
  }
  if (cleaned.length < 7 || !/^\d+$/.test(cleaned)) {
    return "";
  }
  return cleaned;
};

const parseCloudApiError = async (response, sensitiveValues) => {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const metaMessage = payload?.error?.message;
  const metaDetails = payload?.error?.error_data?.details;
  return retainDiagnostics(
    new Error(metaDetails || metaMessage || `WhatsApp Cloud API request failed with status ${response.status}`),
    metaDiagnostics(response, payload, sensitiveValues),
  );
};

const buildInviteMessage = (coupleNames) =>
  `you are specially invited to celebrate the wedding of ${coupleNames || "the couple"}.`;

const buildUrlButtonValue = (inviteLink, mode = DEFAULT_URL_BUTTON_VALUE_MODE) => {
  if (mode === "slug") {
    try {
      const url = new URL(inviteLink);
      const match = url.pathname.match(/^\/invite\/([a-z0-9-]+)\/?$/);
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password &&
        !url.search && !url.hash && match && /[a-z0-9]/.test(match[1]) &&
        !/%|\{|\}|\\/.test(String(inviteLink))) {
        return match[1];
      }
    } catch {
      // Invalid links must never fall back to a full URL in slug mode.
    }
    throw new Error("Invalid invitation URL for WhatsApp sending.");
  }
  if (!inviteLink) return "";
  if (mode === "full") return inviteLink;

  try {
    const url = new URL(inviteLink);
    const cleanPath = url.pathname.replace(/^\/+/, "");
    if (mode === "path") return cleanPath;
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
      ...((templateName || process.env.WHATSAPP_INVITE_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME) === DEFAULT_TEMPLATE_NAME
        ? [{
          type: "header",
          parameters: [{ type: "image", image: { link: INVITATION_HEADER_IMAGE_URL } }],
        }]
        : []),
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

  let response;
  try {
    response = await fetch(
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
  } catch (error) {
    retainDiagnostics(error, {
      failureSource: "no_http_response",
      metaMessage: "No HTTP response received; delivery to Meta is unknown.",
    });
    throw error;
  }

  if (!response.ok) {
    throw await parseCloudApiError(response, [to, normalizedPhone, guestName, coupleNames,
      ...String(coupleNames || "").split(" and "), inviteLink,
      ...String(inviteLink || "").split(/[/?#=&]/).filter(Boolean)]);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    retainDiagnostics(error, {
      failureSource: "application_after_meta_http_response",
      httpStatus: response.status,
      metaMessage: "Could not process Meta HTTP response; send acceptance is unknown.",
    });
    throw error;
  }
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
