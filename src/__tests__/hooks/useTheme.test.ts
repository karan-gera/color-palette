import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REDUCED_THEME_FADE_DURATION, THEME_CHANGE_INTERVAL, useTheme } from '@/hooks/useTheme'

type SystemTheme = 'light' | 'dark' | 'none'

let systemTheme: SystemTheme
let reducedMotion: boolean
let darkModeListener: (() => void) | null
let reducedMotionListener: ((event: MediaQueryListEvent) => void) | null

beforeEach(() => {
  vi.useFakeTimers()
  systemTheme = 'none'
  reducedMotion = false
  darkModeListener = null
  reducedMotionListener = null
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches:
        (query.includes('prefers-reduced-motion') && reducedMotion) ||
        (query.includes('dark') && systemTheme === 'dark') ||
        (query.includes('light') && systemTheme === 'light'),
      addEventListener: vi.fn((_event: string, listener: () => void) => {
        if (query.includes('dark')) darkModeListener = listener
        if (query.includes('prefers-reduced-motion')) {
          reducedMotionListener = listener as (event: MediaQueryListEvent) => void
        }
      }),
      removeEventListener: vi.fn(),
    })),
  })
})

afterEach(() => {
  vi.useRealTimers()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-theme-fading')
  document.documentElement.removeAttribute('data-theme-change-at')
  document.documentElement.removeAttribute('data-theme-wiping')
  document.documentElement.style.backgroundColor = ''
  vi.restoreAllMocks()
})

describe('useTheme', () => {
  it('uses and applies a stored theme on mount', () => {
    localStorage.setItem('color-palette:theme', 'dark')

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement.style.backgroundColor).toBe('rgb(31, 31, 31)')
  })

  it('falls back to the current system theme', () => {
    systemTheme = 'light'

    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('defaults to gray when the system has no light or dark preference', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('gray')
  })

  it('sets, persists, and immediately applies a theme', () => {
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setTheme('dark'))

    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('color-palette:theme')).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('cycles light to gray to dark and wraps to light', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('gray')
    act(() => vi.advanceTimersByTime(THEME_CHANGE_INTERVAL))
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('dark')
    act(() => vi.advanceTimersByTime(THEME_CHANGE_INTERVAL))
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('caps theme cycling globally at two changes per second', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('gray')

    act(() => vi.advanceTimersByTime(THEME_CHANGE_INTERVAL - 1))
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('gray')

    act(() => vi.advanceTimersByTime(1))
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('shares current theme and the change cap between header and keyboard hook instances', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const header = renderHook(() => useTheme())
    const keyboard = renderHook(() => useTheme({ syncExternalChanges: false }))

    act(() => header.result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))
    act(() => header.result.current.applyTransitionTarget())
    act(() => header.result.current.completeTransition())
    expect(header.result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    act(() => vi.advanceTimersByTime(THEME_CHANGE_INTERVAL - 1))
    act(() => keyboard.result.current.cycleTheme())
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    act(() => vi.advanceTimersByTime(1))
    act(() => keyboard.result.current.cycleTheme())
    expect(keyboard.result.current.theme).toBe('light')
    expect(header.result.current.theme).toBe('light')
  })

  it('does not interrupt a normal theme wipe after the rate-limit interval elapses', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const header = renderHook(() => useTheme())
    const keyboard = renderHook(() => useTheme({ syncExternalChanges: false }))

    act(() => header.result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))
    act(() => header.result.current.applyTransitionTarget())
    act(() => vi.advanceTimersByTime(THEME_CHANGE_INTERVAL))
    act(() => keyboard.result.current.cycleTheme())

    expect(header.result.current.transition?.to).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    act(() => header.result.current.completeTransition())
    act(() => keyboard.result.current.cycleTheme())
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('defers applying a transition target until requested', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))

    expect(result.current.theme).toBe('dark')
    expect(result.current.transition).toEqual({
      from: 'light',
      to: 'dark',
      origin: { x: 10, y: 20 },
    })
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => result.current.applyTransitionTarget())
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    act(() => result.current.completeTransition())
    expect(result.current.transition).toBeNull()
  })

  it('uses a brief non-spatial fade for theme changes when reduced motion is requested', () => {
    reducedMotion = true
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))

    expect(result.current.theme).toBe('light')
    expect(result.current.transition).toBeNull()
    expect(document.documentElement).toHaveAttribute('data-theme-fading')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => vi.advanceTimersByTime(REDUCED_THEME_FADE_DURATION))

    expect(result.current.theme).toBe('dark')
    expect(result.current.transition).toBeNull()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).not.toHaveAttribute('data-theme-fading')
  })

  it('finishes a reduced theme fade if reduced motion is disabled mid-transition', () => {
    reducedMotion = true
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))
    reducedMotion = false
    act(() => reducedMotionListener?.({ matches: false } as MediaQueryListEvent))

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).not.toHaveAttribute('data-theme-fading')
  })

  it('finishes an active theme wipe when reduced motion becomes requested', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))
    expect(result.current.transition?.to).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    reducedMotion = true
    act(() => reducedMotionListener?.({ matches: true } as MediaQueryListEvent))

    expect(result.current.transition).toBeNull()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('ignores no-op and overlapping transitions', () => {
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setThemeWithTransition('light', { x: 0, y: 0 }))
    expect(result.current.transition).toBeNull()

    act(() => result.current.setThemeWithTransition('dark', { x: 1, y: 1 }))
    act(() => result.current.setThemeWithTransition('gray', { x: 2, y: 2 }))
    expect(result.current.transition?.to).toBe('dark')
  })

  it('follows system changes until a preference is stored', () => {
    systemTheme = 'dark'
    const { result } = renderHook(() => useTheme())
    expect(darkModeListener).not.toBeNull()

    systemTheme = 'light'
    act(() => darkModeListener?.())

    expect(result.current.theme).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})
