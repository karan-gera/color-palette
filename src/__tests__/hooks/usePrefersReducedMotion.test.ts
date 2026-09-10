import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePrefersReducedMotion', () => {
  it('reads the operating-system preference and follows changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | null = null
    const removeEventListener = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn((_event: string, nextListener: (event: MediaQueryListEvent) => void) => {
          listener = nextListener
        }),
        removeEventListener,
      })),
    })

    const { result, unmount } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)

    act(() => listener?.({ matches: false } as MediaQueryListEvent))
    expect(result.current).toBe(false)

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('defaults to no preference when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: undefined,
    })

    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })
})
