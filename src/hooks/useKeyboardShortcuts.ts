import { useEffect, useCallback } from 'react'

type KeyboardShortcutsConfig = {
  onAddColor: () => void
  onUndo: () => void
  onRedo: () => void
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  onRerollAll: () => void
  onToggleLock: (index: number) => void
  onCycleTheme: () => void
  onToggleHints: () => void
  onEscape: () => void
  colorCount: number
  isDialogOpen: boolean
}

export function useKeyboardShortcuts({
  onAddColor,
  onUndo,
  onRedo,
  onOpen,
  onSave,
  onShare,
  onRerollAll,
  onToggleLock,
  onCycleTheme,
  onToggleHints,
  onEscape,
  colorCount,
  isDialogOpen,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Still allow Escape in inputs
      if (event.key === 'Escape') {
        onEscape()
      }
      return
    }

    // Escape always works
    if (event.key === 'Escape') {
      onEscape()
      return
    }

    // Don't trigger other shortcuts when dialog is open
    if (isDialogOpen) return

    const key = event.key.toLowerCase()
    const hasModifier = event.ctrlKey || event.metaKey

    // Undo: Z or Ctrl/Cmd+Z
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault()
      onUndo()
      return
    }

    // Redo: Shift+Z or Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y
    if ((key === 'z' && event.shiftKey) || (key === 'y' && hasModifier)) {
      event.preventDefault()
      onRedo()
      return
    }

    // Don't intercept if modifier key is pressed (except for undo/redo above)
    if (hasModifier) return

    switch (key) {
      case 'a':
      case ' ':
        event.preventDefault()
        onAddColor()
        break
      case 'o':
        event.preventDefault()
        onOpen()
        break
      case 's':
        event.preventDefault()
        onSave()
        break
      case 'c':
        event.preventDefault()
        onShare()
        break
      case 'r':
        event.preventDefault()
        onRerollAll()
        break
      case 't':
        event.preventDefault()
        onCycleTheme()
        break
      case '?':
      case '/':
        event.preventDefault()
        onToggleHints()
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5': {
        const index = parseInt(key) - 1
        if (index < colorCount) {
          event.preventDefault()
          onToggleLock(index)
        }
        break
      }
    }
  }, [
    onAddColor,
    onUndo,
    onRedo,
    onOpen,
    onSave,
    onShare,
    onRerollAll,
    onToggleLock,
    onCycleTheme,
    onToggleHints,
    onEscape,
    colorCount,
    isDialogOpen,
  ])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export const KEYBOARD_SHORTCUTS = [
  { key: 'A', description: 'add color' },
  { key: 'R', description: 'reroll all' },
  { key: '1-5', description: 'toggle lock' },
  { key: 'Z', description: 'undo' },
  { key: 'Shift+Z', description: 'redo' },
  { key: 'O', description: 'open' },
  { key: 'S', description: 'save' },
  { key: 'C', description: 'copy link' },
  { key: 'T', description: 'cycle theme' },
  { key: 'Esc', description: 'close dialog' },
] as const
