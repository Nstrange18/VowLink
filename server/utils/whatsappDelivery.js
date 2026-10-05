const classifyDeliveryFailure = (reason) => {
  const text = String(reason || "");
  if (/healthy ecosystem engagement/i.test(text)) return "marketing_limited";
  if (/payment|business eligibility/i.test(text)) return "payment_issue";
  return "technical_failure";
};

const failureMessages = {
  marketing_limited: "WhatsApp temporarily limited marketing delivery to this recipient. Try again later or use manual WhatsApp sharing.",
  payment_issue: "WhatsApp could not complete delivery because of a business billing or eligibility issue.",
  technical_failure: "We could not send this invite. Please try again.",
};

module.exports = { classifyDeliveryFailure, failureMessages };
