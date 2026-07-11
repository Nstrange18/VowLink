const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const getPublicSiteUrl = (req) => {
  const configured = trimTrailingSlash(
    process.env.VITE_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || process.env.SITE_URL
  );
  return configured || `https://${req.headers.host}`;
};

module.exports = async (req, res) => {
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
    
    // Choose image:
    // 1. couplePhotoUrl (uploaded photo)
    // 2. customCardBg (selected template)
    // 3. Fallback default VowLink logo
    let imageUrl = '';
    if (user.couplePhotoUrl) {
      let url = user.couplePhotoUrl;
      if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
        url = url.replace('/upload/', '/upload/q_auto,w_500/');
      }
      imageUrl = url;
    } else if (user.customCardBg) {
      const bg = user.customCardBg;
      if (bg.startsWith('http://') || bg.startsWith('https://')) {
        let url = bg;
        if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
          url = url.replace('/upload/', '/upload/q_auto,w_500/');
        }
        imageUrl = url;
      } else {
        const cleanBg = bg.startsWith('/') ? bg : `/${bg}`;
        imageUrl = `${publicSiteUrl}${cleanBg}`;
      }
    } else {
      imageUrl = `${publicSiteUrl}/vowlink-logo.webp`;
    }

    const inviteUrl = `${publicSiteUrl}/invite/${slug}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${inviteUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${inviteUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${imageUrl}">
</head>
<body>
  <p>Redirecting to invitation...</p>
  <script>
    window.location.href = "${inviteUrl}";
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
    const fallbackImg = `${publicSiteUrl}/vowlink-logo.webp`;
    const fallbackUrl = `${publicSiteUrl}/invite/${slug}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${fallbackTitle}</title>
  <meta name="description" content="${fallbackDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${fallbackUrl}">
  <meta property="og:title" content="${fallbackTitle}">
  <meta property="og:description" content="${fallbackDesc}">
  <meta property="og:image" content="${fallbackImg}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
</head>
<body>
  <p>Redirecting to invitation...</p>
  <script>
    window.location.href = "${fallbackUrl}";
  </script>
</body>
</html>
    `.trim();
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
};
