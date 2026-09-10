import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '@/hooks/useTheme'

type SystemTheme = 'light' | 'dark' | 'none'

let systemTheme: SystemTheme
let reducedMotion: boolean
let darkModeListener: (() => void) | null
let reducedMotionListener: ((event: MediaQueryListEvent) => void) | null

beforeEach(() => {
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
  document.documentElement.removeAttribute('data-theme')
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
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('dark')
    act(() => result.current.cycleTheme())
    expect(result.current.theme).toBe('light')
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

  it('applies theme changes immediately when reduced motion is requested', () => {
    reducedMotion = true
    localStorage.setItem('color-palette:theme', 'light')
    const { result } = renderHook(() => useTheme())

    act(() => result.current.setThemeWithTransition('dark', { x: 10, y: 20 }))

    expect(result.current.theme).toBe('dark')
    expect(result.current.transition).toBeNull()
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
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
