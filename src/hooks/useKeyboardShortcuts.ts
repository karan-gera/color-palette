import { useEffect, useCallback } from 'react'

type KeyboardShortcutsConfig = {
  onAddColor: () => void
  onUndo: () => void
  onRedo: () => void
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  onExport: () => void
  onRerollAll: () => void
  onToggleLock: (index: number) => void
  onCycleTheme: () => void
  onToggleHints: () => void
  onToggleContrast: () => void
  onCycleContrastTab: () => void
  onDeleteColor: (index: number) => void
  onRerollColor: (index: number) => void
  onEditColor: (index: number) => void
  onCycleCVD: () => void
  onCycleRelationship: () => void
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
  onExport,
  onRerollAll,
  onToggleLock,
  onCycleTheme,
  onToggleHints,
  onToggleContrast,
  onCycleContrastTab,
  onDeleteColor,
  onRerollColor,
  onEditColor,
  onCycleCVD,
  onCycleRelationship,
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

    // Modifier+number combos (shift+1 = '!' on US keyboards, so use event.code)
    const digitMatch = event.code.match(/^Digit([1-5])$/)
    if (digitMatch) {
      const index = parseInt(digitMatch[1]) - 1
      if (index < colorCount) {
        if (event.shiftKey && event.altKey) {
          event.preventDefault()
          onEditColor(index)
          return
        }
        if (event.shiftKey) {
          event.preventDefault()
          onDeleteColor(index)
          return
        }
        if (event.altKey) {
          event.preventDefault()
          onRerollColor(index)
          return
        }
      }
    }

    // Don't intercept if modifier key is pressed (except for undo/redo and digit combos above)
    if (hasModifier || event.altKey) return

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
      case 'e':
        event.preventDefault()
        onExport()
        break
      case 'r':
        event.preventDefault()
        onRerollAll()
        break
      case 't':
        event.preventDefault()
        if (event.shiftKey) {
          onCycleCVD()
        } else {
          onCycleTheme()
        }
        break
      case 'q':
        event.preventDefault()
        onCycleRelationship()
        break
      case 'k':
        event.preventDefault()
        if (event.shiftKey) {
          if (colorCount >= 2) onCycleContrastTab()
        } else {
          onToggleContrast()
        }
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
    onExport,
    onRerollAll,
    onToggleLock,
    onCycleTheme,
    onToggleHints,
    onToggleContrast,
    onCycleContrastTab,
    onDeleteColor,
    onRerollColor,
    onEditColor,
    onCycleCVD,
    onCycleRelationship,
    onEscape,
    colorCount,
    isDialogOpen,
  ])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export type Modifier = 'shift' | 'alt'

export type ShortcutDef = {
  modifiers?: Modifier[]
  key: string
  description: string
  minColors?: number
}

export type ShortcutGroup = {
  label: string
  shortcuts: ShortcutDef[]
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'palette',
    shortcuts: [
      { key: 'A', description: 'add color' },
      { key: 'R', description: 'reroll all' },
      { key: 'Q', description: 'cycle relationship' },
    ],
  },
  {
    label: 'per-color (1-5)',
    shortcuts: [
      { key: '1-5', description: 'toggle lock' },
      { modifiers: ['shift'], key: '1-5', description: 'delete color' },
      { modifiers: ['alt'], key: '1-5', description: 'reroll color' },
      { modifiers: ['shift', 'alt'], key: '1-5', description: 'edit color' },
    ],
  },
  {
    label: 'file',
    shortcuts: [
      { key: 'O', description: 'open' },
      { key: 'S', description: 'save' },
      { key: 'C', description: 'copy link' },
      { key: 'E', description: 'export' },
    ],
  },
  {
    label: 'view',
    shortcuts: [
      { key: 'T', description: 'cycle theme' },
      { modifiers: ['shift'], key: 'T', description: 'cycle cvd mode' },
      { key: 'K', description: 'contrast' },
      { modifiers: ['shift'], key: 'K', description: 'cycle contrast tab', minColors: 2 },
    ],
  },
  {
    label: 'general',
    shortcuts: [
      { key: 'Z', description: 'undo' },
      { modifiers: ['shift'], key: 'Z', description: 'redo' },
      { key: 'Esc', description: 'close dialog' },
      { key: '/', description: 'shortcuts' },
    ],
  },
]
