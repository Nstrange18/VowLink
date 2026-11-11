const FAQ_LIMITS = Object.freeze({ items: 10, question: 200, answer: 1500 });
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const validItem = (item) => isObject(item) && typeof item.question === "string" && typeof item.answer === "string" &&
  item.question.trim().length > 0 && item.question.trim().length <= FAQ_LIMITS.question &&
  item.answer.trim().length > 0 && item.answer.trim().length <= FAQ_LIMITS.answer;

// Validate before Mongoose casting; patch only supplied FAQ fields.
function parseWeddingSitePatch(value) {
  const fail = () => { throw new Error("Invalid Wedding FAQ. Use up to 10 questions (200 characters) and answers (1500 characters), with no blank items."); };
  if (!isObject(value) || Object.keys(value).some((key) => key !== "faq")) fail();
  if (!Object.hasOwn(value, "faq")) return {};
  const faq = value.faq;
  if (!isObject(faq) || Object.keys(faq).some((key) => !["enabled", "items"].includes(key))) fail();
  const patch = {};
  if (Object.hasOwn(faq, "enabled")) {
    if (typeof faq.enabled !== "boolean") fail();
    patch.enabled = faq.enabled;
  }
  if (Object.hasOwn(faq, "items")) {
    if (!Array.isArray(faq.items) || faq.items.length > FAQ_LIMITS.items || faq.items.some((item) =>
      !validItem(item) || Object.keys(item).some((key) => !["question", "answer"].includes(key)))) fail();
    patch.items = faq.items.map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }));
  }
  return patch;
}

function publicWeddingSite(site) {
  if (site?.faq?.enabled !== true || !Array.isArray(site.faq.items)) return undefined;
  const items = site.faq.items.filter(validItem).slice(0, FAQ_LIMITS.items)
    .map(({ question, answer }) => ({ question: question.trim(), answer: answer.trim() }));
  return items.length ? { faq: { enabled: true, items } } : undefined;
}

module.exports = { FAQ_LIMITS, parseWeddingSitePatch, publicWeddingSite };
