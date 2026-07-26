import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'

const SLOW_REQUEST_MS = 8000
const RECENT_NETWORK_ISSUE_MS = 30000

const getConnection = () => {
  if (typeof navigator === 'undefined') return null
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null
}

const getConnectionSnapshot = () => {
  const connection = getConnection()

  if (!connection) {
    return {
      effectiveType: null,
      downlink: null,
      rtt: null,
    }
  }

  return {
    effectiveType: connection.effectiveType || null,
    downlink: typeof connection.downlink === 'number' ? connection.downlink : null,
    rtt: typeof connection.rtt === 'number' ? connection.rtt : null,
  }
}

const isWeakConnection = ({ effectiveType, downlink, rtt }) => (
  effectiveType === 'slow-2g' ||
  effectiveType === '2g' ||
  (typeof downlink === 'number' && downlink > 0 && downlink < 0.8) ||
  (typeof rtt === 'number' && rtt > 1000)
)

const getInitialState = () => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  connection: getConnectionSnapshot(),
  lastNetworkFailureAt: 0,
  lastSlowRequestAt: 0,
})

const NetworkStatusBanner = () => {
  const [state, setState] = useState(getInitialState)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const updateOnlineState = () => {
      setState((current) => ({
        ...current,
        isOnline: navigator.onLine,
        connection: getConnectionSnapshot(),
        lastNetworkFailureAt: navigator.onLine ? current.lastNetworkFailureAt : Date.now(),
      }))
    }

    const updateConnectionState = () => {
      setState((current) => ({
        ...current,
        connection: getConnectionSnapshot(),
      }))
    }

    const handleApiNetworkIssue = (event) => {
      const detail = event.detail || {}
      setState((current) => ({
        ...current,
        isOnline: navigator.onLine,
        lastNetworkFailureAt: detail.type === 'network-failure' ? Date.now() : current.lastNetworkFailureAt,
        lastSlowRequestAt: detail.type === 'slow-request' ? Date.now() : current.lastSlowRequestAt,
      }))
    }

    window.addEventListener('online', updateOnlineState)
    window.addEventListener('offline', updateOnlineState)
    window.addEventListener('vowlink:api-network-issue', handleApiNetworkIssue)

    const connection = getConnection()
    connection?.addEventListener?.('change', updateConnectionState)

    const timer = window.setInterval(() => setNow(Date.now()), 5000)

    return () => {
      window.removeEventListener('online', updateOnlineState)
      window.removeEventListener('offline', updateOnlineState)
      window.removeEventListener('vowlink:api-network-issue', handleApiNetworkIssue)
      connection?.removeEventListener?.('change', updateConnectionState)
      window.clearInterval(timer)
    }
  }, [])

  const status = useMemo(() => {
    if (!state.isOnline) {
      return {
        tone: 'offline',
        icon: 'mdi:wifi-off',
        title: "You're offline",
        message: 'Changes and sends may not save until your connection returns.',
      }
    }

    if (now - state.lastNetworkFailureAt < RECENT_NETWORK_ISSUE_MS) {
      return {
        tone: 'weak',
        icon: 'mdi:wifi-alert',
        title: 'Connection issue',
        message: 'The last request did not reach the server. Please try again when the network is stable.',
      }
    }

    if (now - state.lastSlowRequestAt < RECENT_NETWORK_ISSUE_MS) {
      return {
        tone: 'slow',
        icon: 'mdi:speedometer-slow',
        title: 'Slow connection',
        message: 'This is taking longer than usual. Uploads, checkout, and WhatsApp sends may be delayed.',
      }
    }

    if (isWeakConnection(state.connection)) {
      return {
        tone: 'weak',
        icon: 'mdi:wifi-strength-1-alert',
        title: 'Weak connection',
        message: 'Your network looks weak. Important actions may take longer to complete.',
      }
    }

    return null
  }, [now, state])

  if (!status) return null

  const isOffline = status.tone === 'offline'
  const shellClass = isOffline
    ? 'network-status-banner--offline border-red-400/35 bg-red-950/95 text-red-50 shadow-red-950/30'
    : 'network-status-banner--weak border-amber-300/35 bg-[#19150d]/95 text-amber-50 shadow-black/25'
  const iconClass = isOffline
    ? 'network-status-banner__icon--offline bg-red-400/15 text-red-200'
    : 'network-status-banner__icon--weak bg-amber-300/15 text-amber-200'

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-90 flex justify-center px-3 sm:bottom-5">
      <div
        role="status"
        aria-live="polite"
        className={`network-status-banner pointer-events-auto flex w-full max-w-xl items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${shellClass}`}
      >
        <span className={`network-status-banner__icon mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon icon={status.icon} className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-tight">{status.title}</span>
          <span className="mt-1 block text-xs leading-relaxed opacity-85">{status.message}</span>
        </span>
      </div>
    </div>
  )
}

export default NetworkStatusBanner
