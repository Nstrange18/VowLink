export const normalizePublicImageUrl = (url) => {
  if (typeof url !== "string" || !url.startsWith("/")) return url || "";
  return url.replace(/\.(png|jpe?g)$/i, ".webp");
};
