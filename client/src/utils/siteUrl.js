const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')

export const getPublicSiteUrl = () => {
  const configured = trimTrailingSlash(import.meta.env.VITE_PUBLIC_SITE_URL)
  if (configured) return configured

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin)
  }

  return 'https://vowlink.co'
}

export const buildPublicUrl = (path = '/') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${getPublicSiteUrl()}${cleanPath}`
}
