export const failureMessages = {
  marketing_limited: "WhatsApp temporarily limited marketing delivery to this recipient. Try again later or use manual WhatsApp sharing.",
  payment_issue: "WhatsApp could not complete delivery because of a business billing or eligibility issue.",
  technical_failure: "We could not send this invite. Please try again.",
};

export const deliveryState = (status, reason = "") => {
  if (status !== "failed") return status;
  if (/healthy ecosystem engagement/i.test(reason)) return "marketing_limited";
  if (/payment|business eligibility/i.test(reason)) return "payment_issue";
  return "technical_failure";
};

export const isMarketingLimited = (guest) =>
  deliveryState(guest?.whatsappStatus, guest?.whatsappFailureReason) === "marketing_limited";

export const failureLabel = (status) => ({
  marketing_limited: "Marketing limited", payment_issue: "Payment issue", technical_failure: "Could not send",
})[status];
