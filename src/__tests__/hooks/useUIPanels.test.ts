import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUIPanels } from '@/hooks/useUIPanels'

beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useUIPanels', () => {
  it('opens and closes contrast with immediate scrolling in reduced motion', () => {
    const { result } = renderHook(() => useUIPanels())

    act(() => result.current.toggleContrast())
    act(() => vi.runOnlyPendingTimers())

    expect(result.current.showContrast).toBe(true)
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: document.body.scrollHeight,
      behavior: 'instant',
    })

    act(() => result.current.toggleContrast())
    expect(result.current.showContrast).toBe(false)
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' })
  })

  it('keeps the existing delayed smooth scroll without reduced motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
    const { result } = renderHook(() => useUIPanels())

    act(() => result.current.toggleContrast())
    act(() => vi.advanceTimersByTime(349))
    expect(window.scrollTo).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    })

    act(() => result.current.toggleContrast())
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' })
  })
})
