import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls the window to the top on every route change with smooth behaviour.
 * Add <ScrollToTop /> once inside <BrowserRouter> in App.jsx.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return null
}

export default ScrollToTop
