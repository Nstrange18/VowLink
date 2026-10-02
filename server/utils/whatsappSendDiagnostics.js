// Preserve diagnostic text while removing known secrets and request identities.
const privateValues = (values) => [
  ...values,
  ...Object.entries(process.env)
    .filter(([key]) => /SECRET|TOKEN|PASSWORD|CREDENTIAL|API_KEY/i.test(key))
    .map(([, value]) => value),
].filter((value) => typeof value === "string" && value.length > 0);

const containsPrivateValue = (text, values) =>
  privateValues(values).some((value) => text.toLowerCase().includes(value.toLowerCase()));

const sanitizeProviderText = (value, sensitiveValues) => {
  const fallback = "Meta rejected the send; provider text withheld for privacy.";
  if (typeof value !== "string" || !value.trim()) return fallback;
  // Do not attempt to salvage serialized requests, credentials or header dumps.
  if (/authorization|bearer\s|(?:access[_ -]?token|app[_ -]?secret|password|credential)\s*[=:]|[{}]/i.test(value)) return fallback;
  let text = value;
  for (const privateValue of privateValues(sensitiveValues).sort((a, b) => b.length - a.length)) {
    const escaped = privateValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "gi"), "[REDACTED]");
  }
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, "[REDACTED URL]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED EMAIL]")
    .replace(/\+?\d(?:[\s().-]*\d){6,}/g, "[REDACTED NUMBER]")
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, " ")
    .slice(0, 2000);
};

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
    metaMessage: sanitizeProviderText(message, sensitiveValues),
    metaDetails: sanitizeProviderText(error?.error_data?.details, sensitiveValues),
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
