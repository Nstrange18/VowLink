export const WISHES_PAGE_SIZE = 10;

export const getUniqueWishes = (data) => {
  const seen = new Set();
  const uniqueWishes = (Array.isArray(data) ? data : [])
    .filter((wish) => {
      const guest = (wish.guestName || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      const message = (wish.message || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
      const key = `${guest}::${message}`;

      if (!message || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    );

  return uniqueWishes;
};
