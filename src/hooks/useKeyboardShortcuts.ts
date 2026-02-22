import { useEffect, useCallback, useRef } from 'react'

type KeyboardShortcutsConfig = {
  onAddColor: () => void
  onUndo: () => void
  onRedo: () => void
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  onExport: () => void
  onImageExport: () => void
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
  onPickColor: () => void
  onCyclePreset: () => void
  onPresetReroll: () => void
  onViewVariations: (index: number) => void
  onToggleDocs: () => void
  onToggleSwapMode: () => void
  onToggleHistory: () => void
  onToggleView: () => void
  onEscape: () => void
  colorCount: number
  isDialogOpen: boolean
  isPaletteView: boolean
}

export function useKeyboardShortcuts({
  onAddColor,
  onUndo,
  onRedo,
  onOpen,
  onSave,
  onShare,
  onExport,
  onImageExport,
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
  onPickColor,
  onCyclePreset,
  onPresetReroll,
  onViewVariations,
  onToggleDocs,
  onToggleSwapMode,
  onToggleHistory,
  onToggleView,
  onEscape,
  colorCount,
  isDialogOpen,
  isPaletteView,
}: KeyboardShortcutsConfig) {
  const lastKeyRef = useRef<{ key: string; time: number } | null>(null)
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

    // M key toggles rearrange mode — palette view only; works even when active (since it counts as a dialog)
    // Requires at least 2 colors to rearrange
    if (event.key.toLowerCase() === 'm' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (isPaletteView && colorCount >= 2) {
        event.preventDefault()
        onToggleSwapMode()
      }
      return
    }

    // Don't trigger other shortcuts when dialog is open
    if (isDialogOpen) return

    const key = event.key.toLowerCase()
    const hasModifier = event.ctrlKey || event.metaKey

    // Undo/redo: palette view only
    if (key === 'z' && !event.shiftKey) {
      if (!isPaletteView) return
      event.preventDefault()
      onUndo()
      return
    }

    if ((key === 'z' && event.shiftKey) || (key === 'y' && hasModifier)) {
      if (!isPaletteView) return
      event.preventDefault()
      onRedo()
      return
    }

    // Modifier+number combos: palette view only (shift+1 = '!' on US keyboards, so use event.code)
    const digitMatch = event.code.match(/^Digit([0-9])$/)
    if (digitMatch) {
      if (!isPaletteView) return
      const index = digitMatch[1] === '0' ? 9 : parseInt(digitMatch[1]) - 1
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

        // V then 1-5 chord (within 500ms)
        if (lastKeyRef.current?.key === 'v' && Date.now() - lastKeyRef.current.time < 500 && index < colorCount) {
          event.preventDefault()
          lastKeyRef.current = null
          onViewVariations(index)
          return
        }
      }
    }

    // Don't intercept if modifier key is pressed (except for undo/redo and digit combos above)
    if (hasModifier || event.altKey) return

    switch (key) {
      case 'a':
      case ' ':
        if (!isPaletteView) break
        event.preventDefault()
        onAddColor()
        break
      case 'o':
        if (!isPaletteView) break
        event.preventDefault()
        onOpen()
        break
      case 's':
        if (!isPaletteView) break
        if (colorCount > 0) {
          event.preventDefault()
          onSave()
        }
        break
      case 'c':
        if (!isPaletteView) break
        if (colorCount > 0) {
          event.preventDefault()
          onShare()
        }
        break
      case 'e':
        // E is context-aware: opens gradient export in gradient view, palette export in palette view
        if (!isPaletteView) {
          event.preventDefault()
          onExport()
        } else if (colorCount > 0) {
          event.preventDefault()
          if (event.shiftKey && hasModifier) {
            onImageExport()
          } else {
            onExport()
          }
        }
        break
      case 'r':
        if (!isPaletteView) break
        if (colorCount > 0) {
          event.preventDefault()
          onRerollAll()
        }
        break
      case 't':
        // Theme / CVD always available
        event.preventDefault()
        if (event.shiftKey) {
          onCycleCVD()
        } else {
          onCycleTheme()
        }
        break
      case 'q':
        if (!isPaletteView) break
        event.preventDefault()
        onCycleRelationship()
        break
      case 'i':
        if (!isPaletteView) break
        event.preventDefault()
        onPickColor()
        break
      case 'p':
        if (!isPaletteView) break
        event.preventDefault()
        if (event.shiftKey) {
          onPresetReroll()
        } else {
          onCyclePreset()
        }
        break
      case 'g':
        // Toggle view — always available
        event.preventDefault()
        onToggleView()
        break
      case 'h':
        if (!isPaletteView) break
        event.preventDefault()
        onToggleHistory()
        break
      case 'k':
        if (!isPaletteView) break
        event.preventDefault()
        if (event.shiftKey) {
          if (colorCount >= 2) onCycleContrastTab()
        } else {
          onToggleContrast()
        }
        break
      case '/':
      case '?':
        // Hints / docs always available
        event.preventDefault()
        if (event.shiftKey || key === '?') {
          onToggleDocs()
        } else {
          onToggleHints()
        }
        break
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9': {
        if (!isPaletteView) break
        const index = key === '0' ? 9 : parseInt(key) - 1
        if (index < colorCount) {
          event.preventDefault()
          onToggleLock(index)
        }
        break
      }
    }

    lastKeyRef.current = { key, time: Date.now() }
  }, [
    onAddColor,
    onUndo,
    onRedo,
    onOpen,
    onSave,
    onShare,
    onExport,
    onImageExport,
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
    onPickColor,
    onCyclePreset,
    onPresetReroll,
    onViewVariations,
    onToggleDocs,
    onToggleSwapMode,
    onToggleHistory,
    onToggleView,
    onEscape,
    colorCount,
    isDialogOpen,
    isPaletteView,
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
      { key: 'P', description: 'cycle preset' },
      { modifiers: ['shift'], key: 'P', description: 'reroll preset' },
      { key: 'I', description: 'pick color' },
      { key: 'M', description: 'rearrange mode' },
    ],
  },
  {
    label: 'per-color (1-9, 0)',
    shortcuts: [
      { key: '1-9, 0', description: 'toggle lock' },
      { modifiers: ['shift'], key: '1-9, 0', description: 'delete color' },
      { modifiers: ['alt'], key: '1-9, 0', description: 'reroll color' },
      { modifiers: ['shift', 'alt'], key: '1-9, 0', description: 'edit color' },
      { key: 'V 1-9, 0', description: 'variations' },
    ],
  },
  {
    label: 'file',
    shortcuts: [
      { key: 'O', description: 'open' },
      { key: 'S', description: 'save' },
      { key: 'C', description: 'copy link' },
      { key: 'E', description: 'export palette / gradient' },
      { modifiers: ['shift'], key: '⌘E', description: 'export image' },
    ],
  },
  {
    label: 'view',
    shortcuts: [
      { key: 'G', description: 'toggle gradient / palette' },
      { key: 'T', description: 'cycle theme' },
      { modifiers: ['shift'], key: 'T', description: 'cycle cvd mode' },
      { key: 'K', description: 'contrast' },
      { modifiers: ['shift'], key: 'K', description: 'cycle contrast tab', minColors: 2 },
      { key: 'H', description: 'history' },
    ],
  },
  {
    label: 'general',
    shortcuts: [
      { key: 'Z', description: 'undo' },
      { modifiers: ['shift'], key: 'Z', description: 'redo' },
      { key: 'Esc', description: 'close dialog' },
      { key: '/', description: 'shortcuts' },
      { modifiers: ['shift'], key: '/', description: 'docs / about' },
    ],
  },
]
