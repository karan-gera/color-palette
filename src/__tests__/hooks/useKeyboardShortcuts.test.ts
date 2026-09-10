import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function makeConfig(overrides: Partial<ReturnType<typeof baseConfig>> = {}) {
  return { ...baseConfig(), ...overrides }
}

function baseConfig() {
  return {
    onAddColor: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onOpen: vi.fn(),
    onSave: vi.fn(),
    onShare: vi.fn(),
    onExport: vi.fn(),
    onImageExport: vi.fn(),
    onRerollAll: vi.fn(),
    onToggleLock: vi.fn(),
    onCycleTheme: vi.fn(),
    onToggleHints: vi.fn(),
    onToggleContrast: vi.fn(),
    onCycleContrastTab: vi.fn(),
    onDeleteColor: vi.fn(),
    onRerollColor: vi.fn(),
    onEditColor: vi.fn(),
    onCycleCVD: vi.fn(),
    onCycleRelationship: vi.fn(),
    onPickColor: vi.fn(),
    onCyclePreset: vi.fn(),
    onPresetReroll: vi.fn(),
    onViewVariations: vi.fn(),
    onToggleDocs: vi.fn(),
    onToggleSwapMode: vi.fn(),
    onToggleHistory: vi.fn(),
    onToggleView: vi.fn(),
    onTogglePreview: vi.fn(),
    onToggleExtract: vi.fn(),
    onToggleHarmony: vi.fn(),
    onEscape: vi.fn(),
    colorCount: 3,
    isDialogOpen: false,
    isPaletteView: true,
  }
}

function renderShortcuts(overrides: Partial<ReturnType<typeof baseConfig>> = {}) {
  const config = makeConfig(overrides)
  renderHook(() => useKeyboardShortcuts(config))
  return config
}

describe('useKeyboardShortcuts', () => {
  it.each([
    ['a', 'onAddColor'],
    [' ', 'onAddColor'],
    ['o', 'onOpen'],
    ['s', 'onSave'],
    ['c', 'onShare'],
    ['e', 'onExport'],
    ['r', 'onRerollAll'],
    ['q', 'onCycleRelationship'],
    ['i', 'onPickColor'],
    ['h', 'onToggleHistory'],
    ['y', 'onToggleHarmony'],
  ] as const)('routes %s to %s in palette view', (key, callback) => {
    const config = renderShortcuts()

    fireEvent.keyDown(window, { key })

    expect(config[callback]).toHaveBeenCalledOnce()
  })

  it.each([
    ['command', { metaKey: true }],
    ['control', { ctrlKey: true }],
  ] as const)('routes shift+%s+e to image export', (_modifier, modifierState) => {
    const config = renderShortcuts()

    fireEvent.keyDown(window, {
      key: 'e',
      code: 'KeyE',
      shiftKey: true,
      ...modifierState,
    })

    expect(config.onImageExport).toHaveBeenCalledOnce()
    expect(config.onExport).not.toHaveBeenCalled()
  })

  it('routes e to gradient export outside palette view even with no palette colors', () => {
    const config = renderShortcuts({ isPaletteView: false, colorCount: 0 })

    fireEvent.keyDown(window, { key: 'e' })

    expect(config.onExport).toHaveBeenCalledOnce()
  })

  it('routes undo and both redo variants only in palette view', () => {
    const config = renderShortcuts()

    fireEvent.keyDown(window, { key: 'z' })
    fireEvent.keyDown(window, { key: 'Z', shiftKey: true })
    fireEvent.keyDown(window, { key: 'y', metaKey: true })

    expect(config.onUndo).toHaveBeenCalledOnce()
    expect(config.onRedo).toHaveBeenCalledTimes(2)
  })

  it('maps digit shortcuts and modifiers to the correct zero-based color index', () => {
    const config = renderShortcuts({ colorCount: 10 })

    fireEvent.keyDown(window, { key: '1', code: 'Digit1' })
    fireEvent.keyDown(window, { key: '!', code: 'Digit1', shiftKey: true })
    fireEvent.keyDown(window, { key: '2', code: 'Digit2', altKey: true })
    fireEvent.keyDown(window, { key: '@', code: 'Digit2', shiftKey: true, altKey: true })
    fireEvent.keyDown(window, { key: '0', code: 'Digit0' })

    expect(config.onToggleLock).toHaveBeenNthCalledWith(1, 0)
    expect(config.onToggleLock).toHaveBeenNthCalledWith(2, 9)
    expect(config.onDeleteColor).toHaveBeenCalledWith(0)
    expect(config.onRerollColor).toHaveBeenCalledWith(1)
    expect(config.onEditColor).toHaveBeenCalledWith(1)
  })

  it('does not route a digit to a color that does not exist', () => {
    const config = renderShortcuts({ colorCount: 2 })

    fireEvent.keyDown(window, { key: '3', code: 'Digit3' })

    expect(config.onToggleLock).not.toHaveBeenCalled()
  })

  it('routes the v then digit chord to color variations', () => {
    const config = renderShortcuts()

    fireEvent.keyDown(window, { key: 'v', code: 'KeyV' })
    fireEvent.keyDown(window, { key: '2', code: 'Digit2' })

    expect(config.onViewVariations).toHaveBeenCalledWith(1)
    expect(config.onToggleLock).not.toHaveBeenCalled()
  })

  it('routes theme, cvd, preset, contrast, and docs variants', () => {
    const config = renderShortcuts()

    fireEvent.keyDown(window, { key: 't' })
    fireEvent.keyDown(window, { key: 'T', shiftKey: true })
    fireEvent.keyDown(window, { key: 'p' })
    fireEvent.keyDown(window, { key: 'P', shiftKey: true })
    fireEvent.keyDown(window, { key: 'k' })
    fireEvent.keyDown(window, { key: 'K', shiftKey: true })
    fireEvent.keyDown(window, { key: '/' })
    fireEvent.keyDown(window, { key: '?', shiftKey: true })

    expect(config.onCycleTheme).toHaveBeenCalledOnce()
    expect(config.onCycleCVD).toHaveBeenCalledOnce()
    expect(config.onCyclePreset).toHaveBeenCalledOnce()
    expect(config.onPresetReroll).toHaveBeenCalledOnce()
    expect(config.onToggleContrast).toHaveBeenCalledOnce()
    expect(config.onCycleContrastTab).toHaveBeenCalledOnce()
    expect(config.onToggleHints).toHaveBeenCalledOnce()
    expect(config.onToggleDocs).toHaveBeenCalledOnce()
  })

  it('keeps global view shortcuts available outside palette view', () => {
    const config = renderShortcuts({ isPaletteView: false })

    fireEvent.keyDown(window, { key: 'g' })
    fireEvent.keyDown(window, { key: 'x' })
    fireEvent.keyDown(window, { key: 'f' })

    expect(config.onToggleView).toHaveBeenCalledOnce()
    expect(config.onToggleExtract).toHaveBeenCalledOnce()
    expect(config.onTogglePreview).toHaveBeenCalledOnce()
    expect(config.onAddColor).not.toHaveBeenCalled()
  })

  it('blocks regular shortcuts while a dialog is open but still handles escape and preview', () => {
    const config = renderShortcuts({ isDialogOpen: true })

    fireEvent.keyDown(window, { key: 'a' })
    fireEvent.keyDown(window, { key: 'f' })
    fireEvent.keyDown(window, { key: 'e', shiftKey: true, metaKey: true })
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(config.onAddColor).not.toHaveBeenCalled()
    expect(config.onTogglePreview).toHaveBeenCalledOnce()
    expect(config.onImageExport).not.toHaveBeenCalled()
    expect(config.onEscape).toHaveBeenCalledOnce()
  })

  it('ignores typing targets except for escape', () => {
    const config = renderShortcuts()
    const input = document.createElement('input')
    document.body.appendChild(input)

    fireEvent.keyDown(input, { key: 'a' })
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(config.onAddColor).not.toHaveBeenCalled()
    expect(config.onEscape).toHaveBeenCalledOnce()
    input.remove()
  })

  it('requires two colors and palette view for rearrange mode', () => {
    const enabled = renderShortcuts({ colorCount: 2 })
    fireEvent.keyDown(window, { key: 'm' })
    expect(enabled.onToggleSwapMode).toHaveBeenCalledOnce()
  })
})
