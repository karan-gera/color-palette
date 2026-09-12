import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

export type Theme = 'light' | 'gray' | 'dark'

const STORAGE_KEY = 'color-palette:theme'
const THEME_CHANGE_EVENT = 'paletteport:theme-change'
export const REDUCED_THEME_FADE_DURATION = 150
export const THEME_KEY_REPEAT_INTERVAL = 500

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'gray'
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  
  if (prefersDark) return 'dark'
  if (prefersLight) return 'light'
  return 'gray'
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'gray'
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'gray' || stored === 'dark') {
    return stored
  }
  
  return getSystemTheme()
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const didChange = root.getAttribute('data-theme') !== theme
  root.setAttribute('data-theme', theme)
  // Also update background color immediately to prevent flash
  const bg = theme === 'dark' ? '#1f1f1f' : theme === 'gray' ? '#8a8a8a' : '#fafafa'
  root.style.backgroundColor = bg
  if (didChange) {
    window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }))
  }
}

export interface ThemeTransition {
  from: Theme
  to: Theme
  origin: { x: number; y: number }
}

type UseThemeOptions = {
  syncExternalChanges?: boolean
}

export function useTheme({ syncExternalChanges = true }: UseThemeOptions = {}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [transition, setTransition] = useState<ThemeTransition | null>(null)
  const reducedFadeTimeoutRef = useRef<number | null>(null)
  const reducedFadeTargetRef = useRef<Theme | null>(null)
  const ownsWipeRef = useRef(false)
  const lastThemeKeyChangeRef = useRef<number | null>(null)

  // Set theme without animation
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }, [])

  const setThemeWithReducedFade = useCallback((newTheme: Theme) => {
    reducedFadeTargetRef.current = newTheme
    if (reducedFadeTimeoutRef.current !== null) return

    document.documentElement.setAttribute('data-theme-fading', '')
    reducedFadeTimeoutRef.current = window.setTimeout(() => {
      const target = reducedFadeTargetRef.current
      if (target) setTheme(target)
      reducedFadeTargetRef.current = null
      document.documentElement.removeAttribute('data-theme-fading')
      reducedFadeTimeoutRef.current = null
    }, REDUCED_THEME_FADE_DURATION)
  }, [setTheme])

  // Set theme with circle wipe animation
  const setThemeWithTransition = useCallback((newTheme: Theme, origin: { x: number; y: number }) => {
    if (newTheme === theme) return // No change
    if (transition) return // Already transitioning - ignore click
    if (reducedFadeTimeoutRef.current !== null) return
    if (document.documentElement.hasAttribute('data-theme-wiping')) return
    if (prefersReducedMotion) {
      setThemeWithReducedFade(newTheme)
      return
    }

    document.documentElement.setAttribute('data-theme-wiping', '')
    ownsWipeRef.current = true
    
    // Start transition - overlay will show new theme expanding
    // Keep OLD theme on document during animation
    setTransition({
      from: theme,
      to: newTheme,
      origin,
    })
    
    // Update state but DON'T apply theme yet - overlay handles visual
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    // Note: applyTheme() is called in applyTransitionTarget, not here
  }, [theme, transition, prefersReducedMotion, setThemeWithReducedFade])

  // Apply the new theme during animation (overlay masks the change)
  const applyTransitionTarget = useCallback(() => {
    if (transition) {
      applyTheme(transition.to)
    }
  }, [transition])

  // Called when animation completes - clear transition state
  const completeTransition = useCallback(() => {
    if (ownsWipeRef.current) {
      document.documentElement.removeAttribute('data-theme-wiping')
      ownsWipeRef.current = false
    }
    setTransition(null)
  }, [])

  const cycleTheme = useCallback((isRepeat = false) => {
    if (document.documentElement.hasAttribute('data-theme-wiping')) return

    const now = Date.now()
    if (
      isRepeat &&
      lastThemeKeyChangeRef.current !== null &&
      now - lastThemeKeyChangeRef.current < THEME_KEY_REPEAT_INTERVAL
    ) return
    lastThemeKeyChangeRef.current = now

    const order: Theme[] = ['light', 'gray', 'dark']
    const appliedTheme = document.documentElement.getAttribute('data-theme') as Theme | null
    const pendingTheme = reducedFadeTargetRef.current
    const currentTheme = pendingTheme ?? (appliedTheme && order.includes(appliedTheme) ? appliedTheme : theme)
    const currentIndex = order.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % order.length
    const nextTheme = order[nextIndex]
    if (prefersReducedMotion) {
      setThemeWithReducedFade(nextTheme)
    } else {
      setTheme(nextTheme)
    }
  }, [theme, prefersReducedMotion, setTheme, setThemeWithReducedFade])

  // Apply theme on mount (but not during transitions)
  useEffect(() => {
    if (!transition) {
      applyTheme(theme)
    }
  }, [theme, transition])

  // If the OS preference changes during a wipe, finish it immediately.
  useEffect(() => {
    if (!prefersReducedMotion || !transition) return
    applyTheme(transition.to)
    if (ownsWipeRef.current) {
      document.documentElement.removeAttribute('data-theme-wiping')
      ownsWipeRef.current = false
    }
    setTransition(null)
  }, [prefersReducedMotion, transition])

  // Finish a reduced-motion fade if the OS preference changes mid-transition.
  useEffect(() => {
    if (prefersReducedMotion || reducedFadeTimeoutRef.current === null) return

    clearTimeout(reducedFadeTimeoutRef.current)
    reducedFadeTimeoutRef.current = null
    const target = reducedFadeTargetRef.current
    reducedFadeTargetRef.current = null
    if (target) setTheme(target)
    document.documentElement.removeAttribute('data-theme-fading')
  }, [prefersReducedMotion, setTheme])

  useEffect(() => {
    if (!syncExternalChanges) return

    const handleThemeChange = (event: Event) => {
      setThemeState((event as CustomEvent<Theme>).detail)
    }
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)

    return () => window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
  }, [syncExternalChanges])

  useEffect(() => {
    return () => {
      if (reducedFadeTimeoutRef.current !== null) {
        clearTimeout(reducedFadeTimeoutRef.current)
      }
      document.documentElement.removeAttribute('data-theme-fading')
      if (ownsWipeRef.current) {
        document.documentElement.removeAttribute('data-theme-wiping')
      }
    }
  }, [])

  // Listen for system theme changes (only if no stored preference)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return // User has explicit preference, don't override

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newTheme = getSystemTheme()
      setThemeState(newTheme)
      applyTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return { 
    theme, 
    setTheme, 
    setThemeWithTransition,
    cycleTheme,
    // Transition state for overlay component
    transition,
    applyTransitionTarget,
    completeTransition,
  }
}
