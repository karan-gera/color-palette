import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'gray' | 'dark'

const STORAGE_KEY = 'color-palette:theme'

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
  document.documentElement.setAttribute('data-theme', theme)
  // Also update background color immediately to prevent flash
  const bg = theme === 'dark' ? '#1f1f1f' : theme === 'gray' ? '#8a8a8a' : '#fafafa'
  document.documentElement.style.backgroundColor = bg
}

export interface ThemeTransition {
  from: Theme
  to: Theme
  origin: { x: number; y: number }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [transition, setTransition] = useState<ThemeTransition | null>(null)

  // Set theme without animation
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }, [])

  // Set theme with circle wipe animation
  const setThemeWithTransition = useCallback((newTheme: Theme, origin: { x: number; y: number }) => {
    if (newTheme === theme) return // No change
    if (transition) return // Already transitioning - ignore click
    
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
  }, [theme, transition])

  // Apply the new theme during animation (overlay masks the change)
  const applyTransitionTarget = useCallback(() => {
    if (transition) {
      applyTheme(transition.to)
    }
  }, [transition])

  // Called when animation completes - clear transition state
  const completeTransition = useCallback(() => {
    setTransition(null)
  }, [])

  const cycleTheme = useCallback(() => {
    const order: Theme[] = ['light', 'gray', 'dark']
    const currentIndex = order.indexOf(theme)
    const nextIndex = (currentIndex + 1) % order.length
    setTheme(order[nextIndex])
  }, [theme, setTheme])

  // Apply theme on mount (but not during transitions)
  useEffect(() => {
    if (!transition) {
      applyTheme(theme)
    }
  }, [theme, transition])

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
