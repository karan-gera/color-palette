import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePresetControl } from '@/hooks/usePresetControl'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePresetControl', () => {
  it('sends generated preset colors through the palette callback', () => {
    const onApplyPalette = vi.fn()
    const { result } = renderHook(() => usePresetControl({
      current: ['#111111', '#222222'],
      lockedStates: [false, false],
      onApplyPalette,
      onNeedsConfirmation: vi.fn(),
    }))

    act(() => result.current.applyPreset('pastel'))

    expect(onApplyPalette).toHaveBeenCalledOnce()
    expect(onApplyPalette.mock.calls[0][0]).toHaveLength(5)
  })

  it('requests confirmation instead of applying when a color is locked', () => {
    const onApplyPalette = vi.fn()
    const onNeedsConfirmation = vi.fn()
    const { result } = renderHook(() => usePresetControl({
      current: ['#111111', '#222222'],
      lockedStates: [true, false],
      onApplyPalette,
      onNeedsConfirmation,
    }))

    act(() => result.current.handlePresetSelect('neon'))

    expect(onNeedsConfirmation).toHaveBeenCalledWith('neon')
    expect(onApplyPalette).not.toHaveBeenCalled()
  })

  it('rerolls an active preset through the palette callback', () => {
    const onApplyPalette = vi.fn()
    const { result } = renderHook(() => usePresetControl({
      current: ['#333333', '#777777', '#bbbbbb'],
      lockedStates: [false, false, false],
      onApplyPalette,
      onNeedsConfirmation: vi.fn(),
    }))

    expect(result.current.activePresetId).toBe('monochrome')

    act(() => result.current.rerollPreset())

    expect(onApplyPalette).toHaveBeenCalledOnce()
  })
})
