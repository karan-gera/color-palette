import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_COLORS } from '@/helpers/colorTheory'
import { usePaletteColors } from '@/hooks/usePaletteColors'

const HISTORY_KEY = 'color-palette:history'

function seedHistory(history: string[][], index = history.length - 1) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ history, index, savedAt: Date.now() }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePaletteColors', () => {
  it('starts empty when there is no persisted or shared palette', () => {
    const { result } = renderHook(() => usePaletteColors())

    expect(result.current.current).toBeUndefined()
    expect(result.current.historyIndex).toBe(-1)
    expect(result.current.lockedStates).toEqual([])
    expect(result.current.colorIds).toEqual([])
  })

  it('restores persisted history and creates stable metadata for the active palette', () => {
    seedHistory([['#111111'], ['#222222', '#333333']], 1)

    const { result } = renderHook(() => usePaletteColors())

    expect(result.current.current).toEqual(['#222222', '#333333'])
    expect(result.current.historyIndex).toBe(1)
    expect(result.current.lockedStates).toEqual([false, false])
    expect(result.current.colorIds).toHaveLength(2)
  })

  it('adds a picked color and matching unlocked metadata', () => {
    seedHistory([['#111111']])
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.addPickedColor('#abcdef'))

    expect(result.current.current).toEqual(['#111111', '#abcdef'])
    expect(result.current.lockedStates).toEqual([false, false])
    expect(result.current.colorIds).toHaveLength(2)
  })

  it('does not add beyond the palette color limit', () => {
    const colors = Array.from({ length: MAX_COLORS }, (_, index) => `#00000${index}`)
    seedHistory([colors])
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.addPickedColor('#ffffff'))

    expect(result.current.current).toEqual(colors)
    expect(result.current.history).toHaveLength(1)
  })

  it('does not reroll a locked color', () => {
    seedHistory([['#111111', '#222222']])
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.toggleLockAt(0))
    act(() => result.current.rerollAt(0))

    expect(result.current.current).toEqual(['#111111', '#222222'])
    expect(result.current.history).toHaveLength(1)
  })

  it('records a single history step when rerolling one color', () => {
    seedHistory([['#111111', '#222222']])
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.rerollAt(0))

    expect(result.current.history).toHaveLength(2)
    expect(result.current.current?.[1]).toBe('#222222')
  })

  it('deletes color, lock state, and id at the same index', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.toggleLockAt(2))
    act(() => result.current.deleteAt(1))

    expect(result.current.current).toEqual(['#111111', '#333333'])
    expect(result.current.lockedStates).toEqual([false, true])
    expect(result.current.colorIds).toHaveLength(2)
    expect(result.current.colorIds[0]).toBe(originalIds[0])
  })

  it('reorders colors and their metadata together', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.toggleLockAt(0))
    act(() => result.current.reorderColors(0, 2))

    expect(result.current.current).toEqual(['#222222', '#333333', '#111111'])
    expect(result.current.lockedStates).toEqual([false, false, true])
    expect(result.current.colorIds).toEqual([originalIds[1], originalIds[2], originalIds[0]])
  })

  it('swaps colors and their metadata together', () => {
    seedHistory([['#111111', '#222222']])
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.toggleLockAt(0))
    act(() => result.current.swapColors(0, 1))

    expect(result.current.current).toEqual(['#222222', '#111111'])
    expect(result.current.lockedStates).toEqual([false, true])
    expect(result.current.colorIds).toEqual([originalIds[1], originalIds[0]])
  })

  it('uses one generated seed when applying a relationship to a fully unlocked palette', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.handleRelationshipChange('complementary'))

    expect(result.current.globalRelationship).toBe('complementary')
    expect(result.current.current?.[0]).toBe('#7fffff')
    expect(result.current.current).toHaveLength(3)
    expect(result.current.history).toHaveLength(2)
  })

  it('cycles through relationship modes in order', () => {
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.cycleRelationship())
    expect(result.current.globalRelationship).toBe('complementary')

    act(() => result.current.cycleRelationship())
    expect(result.current.globalRelationship).toBe('analogous')
  })
})
