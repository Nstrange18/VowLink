const ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const TIMEOUT_MS = 10_000;

const isEmailConfigured = () => Boolean(
  process.env.BREVO_API_KEY?.trim() && process.env.EMAIL_FROM_ADDRESS?.trim()
);

// Never retain provider bodies, request objects, recipients, or original errors.
const failure = (code, httpStatus) => {
  console.error("[EMAIL] Transactional request failed.", { code, ...(httpStatus ? { httpStatus } : {}) });
  return Object.assign(new Error("Transactional email request failed."), { code, httpStatus });
};

const sendTransactionalEmail = async ({ to, subject, html }) => {
  if (!process.env.BREVO_API_KEY?.trim()) throw failure("EMAIL_API_KEY_MISSING");
  if (!process.env.EMAIL_FROM_ADDRESS?.trim()) throw failure("EMAIL_SENDER_MISSING");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response;
    let data;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY.trim(), "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          sender: { email: process.env.EMAIL_FROM_ADDRESS.trim(), name: process.env.EMAIL_FROM_NAME?.trim() || "VowLink" },
          to: [{ email: to }], subject, htmlContent: html,
          ...(process.env.EMAIL_REPLY_TO?.trim() ? { replyTo: { email: process.env.EMAIL_REPLY_TO.trim() } } : {}),
        }),
        signal: controller.signal,
        redirect: "error",
      });
      // Error response text can contain private data; do not read or log it.
      if (response.ok) data = await response.json();
    } catch {
      throw failure(controller.signal.aborted ? "EMAIL_TIMEOUT" : "EMAIL_NETWORK_OR_RESPONSE_ERROR");
    }
    if (!response.ok) throw failure(response.status === 429 ? "EMAIL_RATE_LIMITED" : "EMAIL_PROVIDER_REJECTED", response.status);
    if (typeof data?.messageId !== "string" || !data.messageId.trim()) throw failure("EMAIL_ACCEPTANCE_UNCONFIRMED", response.status);
    // Acceptance is not proof of inbox delivery. Do not retry ambiguous failures here.
    return { accepted: true, provider: "brevo", messageId: data.messageId };
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { sendTransactionalEmail, isEmailConfigured };
