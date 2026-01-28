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

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Listen for system theme changes (only if no stored preference)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return // User has explicit preference, don't override

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newTheme = getSystemTheme()
      setThemeState(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return { theme, setTheme }
}
