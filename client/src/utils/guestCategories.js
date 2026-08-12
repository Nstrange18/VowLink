export const GUEST_CATEGORIES = ["VIP", "Family", "Friend", "Colleague", "Guest"];

const CATEGORY_ALIASES = {
  vip: "VIP",
  vips: "VIP",
  family: "Family",
  families: "Family",
  relative: "Family",
  relatives: "Family",
  friend: "Friend",
  friends: "Friend",
  colleague: "Colleague",
  colleagues: "Colleague",
  coworker: "Colleague",
  coworkers: "Colleague",
  co_worker: "Colleague",
  co_workers: "Colleague",
  guest: "Guest",
  guests: "Guest",
};

export const normalizeGuestCategory = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Guest";

  const exact = GUEST_CATEGORIES.find((category) => category.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return CATEGORY_ALIASES[normalized] || "Guest";
};
