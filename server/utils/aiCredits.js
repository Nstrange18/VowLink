/**
 * aiCredits.js
 * Reusable helpers for checking and enforcing AI generation credit limits.
 * Credits are tracked as a lifetime cap per user account (not monthly).
 *
 * Future extension: add monthlyAiCreditsUsed + aiCreditsResetDate for monthly resets.
 */

const AI_CREDIT_LIMITS = {
  free: 2,
  plus: 20,
  pro: 100,
};

const AI_IMAGE_CREDIT_LIMITS = {
  free: 0,
  plus: 2,
  pro: 10,
};

/**
 * Returns the lifetime AI text credit limit for a given plan tier.
 * @param {string} tier - "free" | "plus" | "pro"
 * @returns {number}
 */
const getAiCreditLimit = (tier) => {
  return AI_CREDIT_LIMITS[tier] ?? AI_CREDIT_LIMITS.free;
};

/**
 * Returns the lifetime AI image credit limit for a given plan tier.
 * @param {string} tier - "free" | "plus" | "pro"
 * @returns {number}
 */
const getAiImageCreditLimit = (tier) => {
  return AI_IMAGE_CREDIT_LIMITS[tier] ?? AI_IMAGE_CREDIT_LIMITS.free;
};

/**
 * Checks whether a user still has AI text credits remaining.
 * @param {object} user - Mongoose user document
 * @returns {{ allowed: boolean, used: number, limit: number, remaining: number }}
 */
const checkAiCredits = (user) => {
  const limit = getAiCreditLimit(user.tier || "free");
  const used = user.aiCreditsUsed ?? 0;
  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
  };
};

/**
 * Checks whether a user still has AI image credits remaining.
 * @param {object} user - Mongoose user document
 * @returns {{ allowed: boolean, used: number, limit: number, remaining: number }}
 */
const checkAiImageCredits = (user) => {
  const limit = getAiImageCreditLimit(user.tier || "free");
  const used = user.aiImageCreditsUsed ?? 0;
  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
  };
};

module.exports = {
  getAiCreditLimit,
  checkAiCredits,
  getAiImageCreditLimit,
  checkAiImageCredits,
};
