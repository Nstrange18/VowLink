import { act, renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import useCountdown from './useCountdown'

test('counts down, stops at zero and clears the timer when unmounted', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2030-01-01T12:00:00Z'))
  const clear = vi.spyOn(globalThis, 'clearInterval')
  const { result, unmount } = renderHook(() => useCountdown('2030-01-02T13:02:03Z'))
  expect(result.current).toEqual({ days: 1, hours: 1, minutes: 2, seconds: 3 })
  act(() => vi.advanceTimersByTime(1000))
  expect(result.current.seconds).toBe(2)
  act(() => { vi.setSystemTime(new Date('2030-01-03T12:00:00Z')); vi.advanceTimersByTime(1000) })
  expect(result.current).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  unmount()
  expect(clear).toHaveBeenCalled()
})

test('does not create a countdown before an event date is available', () => {
  const { result } = renderHook(() => useCountdown(undefined))
  expect(result.current).toBeNull()
})
