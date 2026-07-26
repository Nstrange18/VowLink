const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const getPublicSiteUrl = (req) => {
  const configured = trimTrailingSlash(
    process.env.VITE_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || process.env.SITE_URL
  );
  return configured || `https://${req.headers.host}`;
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const optimizePreviewImage = (url) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_jpg,q_auto,w_1200,h_630,c_fill,g_auto/');
  }
  return url;
};

const toAbsoluteImageUrl = (image, publicSiteUrl) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return optimizePreviewImage(image);
  }
  if (image.startsWith('data:')) return '';
  const cleanImage = image.startsWith('/') ? image : `/${image}`;
  return `${publicSiteUrl}${cleanImage}`;
};

export default async function handler(req, res) {
  const { slug } = req.query;
  if (!slug) {
    return res.status(400).send('Slug is required');
  }

  let apiBaseUrl = process.env.VITE_API_URL || process.env.API_URL;
  apiBaseUrl = apiBaseUrl ? trimTrailingSlash(apiBaseUrl) : '';
  const publicSiteUrl = getPublicSiteUrl(req);

  try {
    if (!apiBaseUrl) {
      throw new Error('VITE_API_URL is required for share previews');
    }

    const url = `${apiBaseUrl}/invitations/slug/${slug}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }
    
    const invitation = await response.json();
    if (!invitation) {
      throw new Error('Empty invitation data');
    }

    const user = invitation.userId || {};
    const partner1 = user.partner1Name || '';
    const partner2 = user.partner2Name || '';
    const coupleNames = partner1 && partner2 ? `${partner1} & ${partner2}` : 'Our';
    const coupleNamesText = partner1 && partner2 ? `${partner1} and ${partner2}` : 'us';

    const title = `${coupleNames}'s Wedding Invitation`;
    
    let descriptionText = user.customShareMessage
      ? user.customShareMessage.trim()
      : `You are specially invited to celebrate the wedding of ${coupleNamesText}. Tap the link to view your invitation and RSVP.`;
    
    // Ensure "Powered by VowLink" is included in description
    const description = descriptionText.toLowerCase().includes('powered by vowlink')
      ? descriptionText
      : `${descriptionText} Powered by VowLink.`;
    
    const firstGalleryPhoto = Array.isArray(user.galleryPhotos) ? user.galleryPhotos.find(Boolean) : '';
    const imageUrl =
      toAbsoluteImageUrl(user.couplePhotoUrl, publicSiteUrl) ||
      toAbsoluteImageUrl(firstGalleryPhoto, publicSiteUrl) ||
      toAbsoluteImageUrl(user.customCardBg, publicSiteUrl) ||
      `${publicSiteUrl}/vowlink-logo.png`;

    const inviteUrl = `${publicSiteUrl}/invite/${slug}`;
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeInviteUrl = escapeHtml(inviteUrl);
    const safeImageUrl = escapeHtml(imageUrl);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${safeInviteUrl}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${safeInviteUrl}">
  <meta property="twitter:title" content="${safeTitle}">
  <meta property="twitter:description" content="${safeDescription}">
  <meta property="twitter:image" content="${safeImageUrl}">
</head>
<body>
  <p>Redirecting to invitation...</p>
  <script>
    window.location.href = ${JSON.stringify(inviteUrl)};
  </script>
</body>
</html>
    `.trim();

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error rendering preview:', error.message);
    const fallbackTitle = "Wedding Invitation | VowLink";
    const fallbackDesc = "You are specially invited to celebrate. Tap the link to view your invitation and RSVP. Powered by VowLink.";
    const publicSiteUrl = getPublicSiteUrl(req);
    const fallbackImg = `${publicSiteUrl}/vowlink-logo.png`;
    const fallbackUrl = `${publicSiteUrl}/invite/${slug}`;
    const safeFallbackTitle = escapeHtml(fallbackTitle);
    const safeFallbackDesc = escapeHtml(fallbackDesc);
    const safeFallbackImg = escapeHtml(fallbackImg);
    const safeFallbackUrl = escapeHtml(fallbackUrl);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${safeFallbackTitle}</title>
  <meta name="description" content="${safeFallbackDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${safeFallbackUrl}">
  <meta property="og:title" content="${safeFallbackTitle}">
  <meta property="og:description" content="${safeFallbackDesc}">
  <meta property="og:image" content="${safeFallbackImg}">
  <meta property="og:image:secure_url" content="${safeFallbackImg}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
</head>
<body>
  <p>Redirecting to invitation...</p>
  <script>
    window.location.href = ${JSON.stringify(fallbackUrl)};
  </script>
</body>
</html>
    `.trim();
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
}
