// Provider text is untrusted: retain only known, non-personal messages.
const SAFE_MESSAGES = new Set([
  "Invalid parameter",
  "Unsupported post request",
  "Message failed to send because there were one or more errors related to your payment method.",
  "Business eligibility payment issue",
  "Service temporarily unavailable",
]);

const privateValues = (values) => [
  ...values,
  ...Object.entries(process.env)
    .filter(([key]) => /SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY/i.test(key))
    .map(([, value]) => value),
].filter((value) => typeof value === "string" && value.length > 0);

const containsPrivateValue = (text, values) =>
  privateValues(values).some((value) => text.toLowerCase().includes(value.toLowerCase()));

const metaDiagnostics = (response, payload, sensitiveValues) => {
  const error = payload?.error;
  const message = error?.message;
  const safeIdentifier = (value, pattern) =>
    typeof value === "string" && pattern.test(value) &&
    !containsPrivateValue(value, sensitiveValues) ? value : undefined;
  const integer = (value) => Number.isSafeInteger(value) && value >= 0 ? value : undefined;
  return {
    failureSource: "meta_http_error",
    httpStatus: integer(response.status),
    metaCode: integer(error?.code),
    metaSubcode: integer(error?.error_subcode),
    metaType: safeIdentifier(error?.type, /^[A-Za-z]+(?:Exception|Error)$/),
    metaMessage: SAFE_MESSAGES.has(message) && !containsPrivateValue(message, sensitiveValues)
      ? message : "Meta rejected the send; provider text withheld for privacy.",
    fbtrace_id: safeIdentifier(error?.fbtrace_id, /^(?!.*\d{7})[A-Za-z0-9_-]{8,100}$/),
  };
};

// Keep metadata separate from Error.message, which existing public responses use.
const diagnostics = new WeakMap();
const retainDiagnostics = (error, data) => {
  if (error && (typeof error === "object" || typeof error === "function")) {
    diagnostics.set(error, data);
  }
  return error;
};

const getSendDiagnostics = (error, metaAccepted = false) => {
  const retained = error && typeof error === "object" ? diagnostics.get(error) : undefined;
  return retained || {
    failureSource: metaAccepted ? "application_after_meta_acceptance" : "application_before_meta_response",
    metaMessage: "Application processing failed.",
  };
};

module.exports = { metaDiagnostics, retainDiagnostics, getSendDiagnostics };
