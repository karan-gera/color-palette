import { useCallback, useState } from 'react'

export const FIRST_VISIT_WELCOME_KEY = 'color-palette:first-visit-welcome'

function hasDismissedWelcome(): boolean {
  try {
    return localStorage.getItem(FIRST_VISIT_WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

function rememberWelcomeDismissal(): void {
  try {
    localStorage.setItem(FIRST_VISIT_WELCOME_KEY, '1')
  } catch (error) {
    console.warn('[welcome] Failed to save first-visit state:', error)
  }
}

export function useFirstVisitWelcome() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => !hasDismissedWelcome())

  const dismissWelcome = useCallback(() => {
    rememberWelcomeDismissal()
    setIsWelcomeOpen(false)
  }, [])

  return { isWelcomeOpen, dismissWelcome }
}
