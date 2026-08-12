import api from './api'

const VISITOR_KEY = 'vowlink_visitor_id'
const SESSION_KEY = 'vowlink_session_id'

const createId = (prefix) => {
  const randomPart = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}_${randomPart}`
}

const getStoredId = (key, prefix) => {
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const next = createId(prefix)
  localStorage.setItem(key, next)
  return next
}

const getDeviceType = () => {
  const width = window.innerWidth || 0
  if (width <= 640) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

export const getPageVisitMeta = (pathname) => {
  const inviteMatch = pathname.match(/^\/invite\/([^/?#]+)/)
  if (inviteMatch) {
    return { pageType: 'invite', slug: inviteMatch[1] }
  }

  if (pathname === '/') {
    return { pageType: 'landing', slug: '' }
  }

  if (['/features', '/pricing', '/templates', '/privacy', '/terms'].includes(pathname)) {
    return { pageType: 'marketing', slug: pathname.replace('/', '') }
  }

  if (pathname.startsWith('/check-in/')) {
    return { pageType: 'check_in', slug: pathname.split('/').filter(Boolean).at(-1) || '' }
  }

  return { pageType: 'unknown', slug: '' }
}

export const shouldTrackVisit = (pathname) => (
  pathname === '/' ||
  pathname === '/features' ||
  pathname === '/pricing' ||
  pathname === '/templates' ||
  pathname === '/privacy' ||
  pathname === '/terms' ||
  pathname.startsWith('/invite/')
)

export const trackVisit = async ({ pathname, search = '' }) => {
  if (typeof window === 'undefined' || !shouldTrackVisit(pathname)) return

  const { pageType, slug } = getPageVisitMeta(pathname)

  try {
    await api.post('/analytics/visit', {
      visitorId: getStoredId(VISITOR_KEY, 'visitor'),
      sessionId: getStoredId(SESSION_KEY, 'session'),
      pageType,
      path: `${pathname}${search || ''}`.slice(0, 300),
      slug,
      referrer: document.referrer || '',
      deviceType: getDeviceType(),
    }, {
      metadata: { silent: true },
    })
  } catch {
    // Visit tracking must never interrupt the guest experience.
  }
}
