import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { Socket } from 'node:net'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  // Freeze dates without replacing timers used by user-event and React.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2030-01-01T12:00:00Z'))
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

  const blockNetwork = () => {
    throw new Error('Unexpected network request: mock the service in this test')
  }
  vi.stubGlobal('fetch', vi.fn(blockNetwork))
  vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(blockNetwork)
  vi.spyOn(Socket.prototype, 'connect').mockImplementation(blockNetwork)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.clear()
  sessionStorage.clear()
})
