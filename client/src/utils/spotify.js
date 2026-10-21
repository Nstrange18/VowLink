export const getSpotifyEmbedUrl = (url) => {
  if (!url) return "";
  const match = url.match(
    /spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9\-_]+)/,
  );
  if (match) {
    const type = match[1];
    const id = match[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&autoplay=1`;
  }
  return "";
};
