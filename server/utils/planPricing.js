const crypto = require("node:crypto");
// Current prices for new purchases. Never use these to rewrite historical amounts.
const PLAN_PRICES_NGN = Object.freeze({ free: 1500, plus: 2000, pro: 3000 });
const LEGACY_PLAN_PRICES_NGN = Object.freeze({ free: 30000, plus: 68000, pro: 80000 });
const PRICING_VERSION = "2026-11-23";
// Bounded rollout window for old pages/in-flight transactions while frontend
// and backend deploy independently. Provider creation time is authoritative.
const PRICING_CUTOVER_AT = "2026-11-23T20:00:00.000Z";
const retainPurchasedTier = (current, purchased) => {
  const ranks = { unpaid: 0, free: 1, plus: 2, pro: 3 };
  return (ranks[current] || 0) > ranks[purchased] ? current : purchased;
};
const quoteSignature = (secret, { tier, userId, email, reference, amount }) => crypto.createHmac("sha256", secret)
  .update(JSON.stringify([PRICING_VERSION, tier, String(userId), email.toLowerCase(), reference, "NGN", amount])).digest("hex");
function planPaymentMatches(transaction, { tier, userId, email, secret }) {
  const metadata = transaction?.metadata;
  if (!transaction || transaction.status !== "success" || transaction.currency !== "NGN" ||
      !Number.isSafeInteger(transaction.amount) || transaction.amount <= 0 || !transaction.reference ||
      metadata?.paymentType !== "couple_upgrade" || metadata.tier !== tier ||
      String(metadata.userId) !== String(userId) || transaction.customer?.email?.toLowerCase() !== email.toLowerCase() ||
      !Object.hasOwn(PLAN_PRICES_NGN, tier)) return false;
  if (metadata.pricingVersion !== undefined || metadata.priceSignature !== undefined) {
    if (metadata.pricingVersion !== PRICING_VERSION || transaction.amount !== PLAN_PRICES_NGN[tier] * 100) return false;
    const expected = quoteSignature(secret, { tier, userId, email, reference: transaction.reference, amount: transaction.amount });
    const signature = metadata.priceSignature;
    return typeof signature === "string" && /^[a-f0-9]{64}$/.test(signature) &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
  const created = new Date(transaction.created_at || transaction.createdAt).getTime();
  return Number.isFinite(created) && created < Date.parse(PRICING_CUTOVER_AT) &&
    transaction.amount === LEGACY_PLAN_PRICES_NGN[tier] * 100;
}

module.exports = { PLAN_PRICES_NGN, LEGACY_PLAN_PRICES_NGN, PRICING_VERSION, PRICING_CUTOVER_AT, quoteSignature, planPaymentMatches, retainPurchasedTier };
