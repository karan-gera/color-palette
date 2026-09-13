import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePresetControl } from '@/hooks/usePresetControl'
import type { ColorMeta } from '@/hooks/usePaletteColors'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePresetControl', () => {
  it('keeps existing color identities when applying a same-size preset', () => {
    const push = vi.fn()
    const originalIds = ['one', 'two', 'three', 'four', 'five']
    const { result } = renderHook(() => {
      const [colorMeta, setColorMeta] = useState<ColorMeta>({
        locked: new Array(5).fill(false),
        ids: originalIds,
      })
      const preset = usePresetControl({
        current: ['#111111', '#222222', '#333333', '#444444', '#555555'],
        lockedStates: colorMeta.locked,
        push,
        setColorMeta,
        onNeedsConfirmation: vi.fn(),
      })
      return { ...preset, colorMeta }
    })

    act(() => result.current.applyPreset('pastel'))

    expect(push).toHaveBeenCalledOnce()
    expect(result.current.colorMeta.ids).toEqual(originalIds)
    expect(result.current.colorMeta.locked).toEqual(new Array(5).fill(false))
  })

  it('keeps the stationary row identities and creates ids for new preset colors', () => {
    const push = vi.fn()
    const originalIds = ['one', 'two', 'three']
    const { result } = renderHook(() => {
      const [colorMeta, setColorMeta] = useState<ColorMeta>({
        locked: new Array(3).fill(false),
        ids: originalIds,
      })
      const preset = usePresetControl({
        current: ['#111111', '#222222', '#333333'],
        lockedStates: colorMeta.locked,
        push,
        setColorMeta,
        onNeedsConfirmation: vi.fn(),
      })
      return { ...preset, colorMeta }
    })

    act(() => result.current.applyPreset('neon'))

    expect(result.current.colorMeta.ids.slice(0, 3)).toEqual(originalIds)
    expect(result.current.colorMeta.ids).toHaveLength(5)
    expect(new Set(result.current.colorMeta.ids).size).toBe(5)
  })

  it('rerolls the active preset without replacing stationary color identities', () => {
    const push = vi.fn()
    const originalIds = ['one', 'two', 'three']
    const { result } = renderHook(() => {
      const [colorMeta, setColorMeta] = useState<ColorMeta>({
        locked: new Array(3).fill(false),
        ids: originalIds,
      })
      const preset = usePresetControl({
        current: ['#333333', '#777777', '#bbbbbb'],
        lockedStates: colorMeta.locked,
        push,
        setColorMeta,
        onNeedsConfirmation: vi.fn(),
      })
      return { ...preset, colorMeta }
    })

    expect(result.current.activePresetId).toBe('monochrome')

    act(() => result.current.rerollPreset())

    expect(push).toHaveBeenCalledOnce()
    expect(result.current.colorMeta.ids.slice(0, 3)).toEqual(originalIds)
  })
})
