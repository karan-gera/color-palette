import { useState, useEffect } from 'react'

type UseListKeyboardNavOptions = {
  count: number
  onEnter: (index: number) => void
  onNavigate?: (newIndex: number) => void
  onDelete?: (index: number) => void
  enabled?: boolean
}

export function useListKeyboardNav({
  count,
  onEnter,
  onNavigate,
  onDelete,
  enabled = true,
}: UseListKeyboardNavOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault()
          setSelectedIndex(prev => {
            const next = Math.max(0, prev - 1)
            if (next !== prev) onNavigate?.(next)
            return next
          })
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          setSelectedIndex(prev => {
            const next = Math.min(count - 1, prev + 1)
            if (next !== prev) onNavigate?.(next)
            return next
          })
          break
        }
        case 'Enter':
          e.preventDefault()
          onEnter(selectedIndex)
          break
        case 'Delete':
        case 'Backspace':
          if (onDelete && (e.target as HTMLElement).tagName !== 'INPUT') {
            e.preventDefault()
            onDelete(selectedIndex)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [count, selectedIndex, onEnter, onNavigate, onDelete, enabled])

  return { selectedIndex, setSelectedIndex }
}
