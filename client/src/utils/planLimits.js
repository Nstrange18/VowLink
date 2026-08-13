export const PLAN_LABELS = {
  unpaid: "Trial",
  free: "Classic",
  plus: "Plus",
  pro: "Pro",
};

export const INVITATION_LIMITS = {
  unpaid: 0,
  free: 1,
  plus: 100,
  pro: 500,
};

export const getPlanLabel = (tier = "unpaid") => PLAN_LABELS[tier] || "Trial";

export const getInvitationLimit = (tier = "unpaid") =>
  INVITATION_LIMITS[tier] ?? INVITATION_LIMITS.unpaid;

export const canBulkImport = (tier = "unpaid") => ["plus", "pro"].includes(tier);

export const canUseGuestCheckIn = (tier = "unpaid") => ["plus", "pro"].includes(tier);

export const canUseStaffMode = (tier = "unpaid") => tier === "pro";
