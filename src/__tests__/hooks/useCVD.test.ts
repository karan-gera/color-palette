import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isValidCVD, useCVD } from '@/hooks/useCVD'

let reducedMotion: boolean
let reducedMotionListener: ((event: MediaQueryListEvent) => void) | null

beforeEach(() => {
  vi.useFakeTimers()
  reducedMotion = false
  reducedMotionListener = null
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: reducedMotion,
      addEventListener: vi.fn((_event: string, listener: (event: MediaQueryListEvent) => void) => {
        reducedMotionListener = listener
      }),
      removeEventListener: vi.fn(),
    })),
  })
})

afterEach(() => {
  vi.useRealTimers()
  document.documentElement.removeAttribute('data-cvd')
  document.documentElement.removeAttribute('data-cvd-transitioning')
})

describe('isValidCVD', () => {
  it.each(['normal', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia'])(
    'accepts %s',
    value => expect(isValidCVD(value)).toBe(true),
  )

  it.each([null, '', 'unknown'])('rejects %s', value => {
    expect(isValidCVD(value)).toBe(false)
  })
})

describe('useCVD', () => {
  it('restores and applies a saved simulation on mount', () => {
    localStorage.setItem('color-palette:cvd', 'protanopia')

    const { result } = renderHook(() => useCVD())

    expect(result.current.cvd).toBe('protanopia')
    expect(result.current.cvdLabel).toBe('Protanopia (red-blind)')
    expect(document.documentElement).toHaveAttribute('data-cvd', 'protanopia')
  })

  it('defaults invalid saved state to normal vision', () => {
    localStorage.setItem('color-palette:cvd', 'invalid')

    const { result } = renderHook(() => useCVD())

    expect(result.current.cvd).toBe('normal')
    expect(document.documentElement).not.toHaveAttribute('data-cvd')
  })

  it('applies a simulation through the two-phase fade', () => {
    const { result } = renderHook(() => useCVD())

    act(() => result.current.setCVD('deuteranopia'))
    expect(document.documentElement).toHaveAttribute('data-cvd-transitioning')
    expect(result.current.cvd).toBe('normal')

    act(() => vi.advanceTimersByTime(150))
    expect(result.current.cvd).toBe('deuteranopia')
    expect(localStorage.getItem('color-palette:cvd')).toBe('deuteranopia')
    expect(document.documentElement).toHaveAttribute('data-cvd', 'deuteranopia')
    expect(document.documentElement).not.toHaveAttribute('data-cvd-transitioning')

    act(() => vi.advanceTimersByTime(150))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('applies a simulation immediately when reduced motion is requested', () => {
    reducedMotion = true
    const { result } = renderHook(() => useCVD())

    act(() => result.current.setCVD('deuteranopia'))

    expect(result.current.cvd).toBe('deuteranopia')
    expect(document.documentElement).toHaveAttribute('data-cvd', 'deuteranopia')
    expect(document.documentElement).not.toHaveAttribute('data-cvd-transitioning')
  })

  it('finishes an active fade at the latest target when reduced motion becomes requested', () => {
    const { result } = renderHook(() => useCVD())

    act(() => {
      result.current.setCVD('deuteranopia')
      result.current.setCVD('tritanopia')
    })
    expect(document.documentElement).toHaveAttribute('data-cvd-transitioning')

    reducedMotion = true
    act(() => reducedMotionListener?.({ matches: true } as MediaQueryListEvent))

    expect(result.current.cvd).toBe('tritanopia')
    expect(document.documentElement).toHaveAttribute('data-cvd', 'tritanopia')
    expect(document.documentElement).not.toHaveAttribute('data-cvd-transitioning')

    act(() => vi.advanceTimersByTime(300))
    expect(result.current.cvd).toBe('tritanopia')
  })

  it('queues the latest selection made during a transition', () => {
    const { result } = renderHook(() => useCVD())

    act(() => {
      result.current.setCVD('deuteranopia')
      result.current.setCVD('tritanopia')
    })
    act(() => vi.advanceTimersByTime(300))
    act(() => vi.advanceTimersByTime(150))

    expect(result.current.cvd).toBe('tritanopia')
    expect(document.documentElement).toHaveAttribute('data-cvd', 'tritanopia')
  })

  it('cycles through simulation modes', () => {
    const { result } = renderHook(() => useCVD())

    act(() => result.current.cycleCVD())
    act(() => vi.advanceTimersByTime(150))

    expect(result.current.cvd).toBe('deuteranopia')
  })

  it('removes the data attribute when returning to normal vision', () => {
    localStorage.setItem('color-palette:cvd', 'achromatopsia')
    const { result } = renderHook(() => useCVD())

    act(() => result.current.setCVD('normal'))
    act(() => vi.advanceTimersByTime(150))

    expect(document.documentElement).not.toHaveAttribute('data-cvd')
  })

  it('clears a pending transition timer on unmount', () => {
    const { result, unmount } = renderHook(() => useCVD())
    act(() => result.current.setCVD('deuteranopia'))

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
