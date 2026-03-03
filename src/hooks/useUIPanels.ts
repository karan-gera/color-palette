import { useState, useCallback, useEffect } from 'react'

const HINTS_KEY = 'color-palette:show-hints'
const CONTRAST_KEY = 'color-palette:show-contrast'

export type UseUIPanelsReturn = {
  showHints: boolean
  showContrast: boolean
  showDocs: boolean
  showHistory: boolean
  showHarmony: boolean
  notification: string | null
  setNotification: (msg: string | null) => void
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>
  setShowHarmony: React.Dispatch<React.SetStateAction<boolean>>
  toggleHints: () => void
  toggleContrast: () => void
  toggleDocs: () => void
  closeDocs: () => void
}

export function useUIPanels(): UseUIPanelsReturn {
  const [showHints, setShowHints] = useState(() => {
    const stored = localStorage.getItem(HINTS_KEY)
    return stored !== 'false'
  })
  const [showContrast, setShowContrast] = useState(() => {
    const stored = localStorage.getItem(CONTRAST_KEY)
    return stored === 'true'
  })
  const [showDocs, setShowDocs] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showHarmony, setShowHarmony] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  // Auto-dismiss notification after 2s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const toggleHints = useCallback(() => {
    setShowHints(prev => {
      const next = !prev
      localStorage.setItem(HINTS_KEY, String(next))
      return next
    })
  }, [])

  const toggleDocs = useCallback(() => {
    setShowDocs(prev => !prev)
  }, [])

  const toggleContrast = useCallback(() => {
    setShowContrast(prev => {
      const next = !prev
      localStorage.setItem(CONTRAST_KEY, String(next))
      if (next) {
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }, 350)
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return next
    })
  }, [])

  const closeDocs = useCallback(() => {
    setShowDocs(false)
  }, [])

  return {
    showHints,
    showContrast,
    showDocs,
    showHistory,
    showHarmony,
    notification,
    setNotification,
    setShowHistory,
    setShowHarmony,
    toggleHints,
    toggleContrast,
    toggleDocs,
    closeDocs,
  }
}
