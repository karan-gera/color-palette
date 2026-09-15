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
    const originalIds = result.current.colorIds

    act(() => result.current.rerollAt(0))

    expect(result.current.history).toHaveLength(2)
    expect(result.current.current?.[1]).toBe('#222222')
    expect(result.current.colorIds).toEqual(originalIds)
  })

  it('preserves color identities when rerolling the palette', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.toggleLockAt(1))
    act(() => result.current.rerollAll())

    expect(result.current.current?.[1]).toBe('#222222')
    expect(result.current.colorIds).toEqual(originalIds)
  })

  it('preserves color identities when changing the relationship', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.handleRelationshipChange('triadic'))

    expect(result.current.globalRelationship).toBe('triadic')
    expect(result.current.colorIds).toEqual(originalIds)
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

  it('keeps colors and metadata aligned through repeated varying-size undo and redo', () => {
    const history = Array.from({ length: 95 }, (_, index) =>
      Array.from({ length: (index % MAX_COLORS) + 1 }, (_, colorIndex) =>
        `#${(index * MAX_COLORS + colorIndex).toString(16).padStart(6, '0')}`
      )
    )
    history.push([])
    seedHistory(history)
    const { result } = renderHook(() => usePaletteColors())

    const expectSnapshot = (index: number) => {
      expect(result.current.historyIndex).toBe(index)
      expect(result.current.current).toEqual(history[index])
      expect(result.current.colorIds).toHaveLength(history[index].length)
      expect(result.current.lockedStates).toHaveLength(history[index].length)
      expect(new Set(result.current.colorIds).size).toBe(result.current.colorIds.length)
    }

    expectSnapshot(history.length - 1)
    for (let index = history.length - 2; index >= 0; index -= 1) {
      act(() => result.current.undo())
      expectSnapshot(index)
    }
    for (let index = 1; index < history.length; index += 1) {
      act(() => result.current.redo())
      expectSnapshot(index)
    }

    expect(result.current.current).toEqual([])
    expect(result.current.canRedo).toBe(false)
  })

  it('resets projection only when history navigation changes ordered color ids', () => {
    seedHistory([
      ['#111111', '#222222'],
      ['#aaaaaa', '#bbbbbb'],
      ['#cccccc', '#dddddd', '#eeeeee'],
    ])
    const { result } = renderHook(() => usePaletteColors())

    expect(result.current.navigationEpoch).toBe(0)
    act(() => result.current.undo())
    expect(result.current.navigationEpoch).toBe(1)
    act(() => result.current.undo())
    expect(result.current.navigationEpoch).toBe(1)
    act(() => result.current.redo())
    expect(result.current.navigationEpoch).toBe(1)
    act(() => result.current.redo())
    expect(result.current.navigationEpoch).toBe(2)
  })

  it('keeps a surviving color identity and lock attached across delete history', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.toggleLockAt(2))
    const survivingId = result.current.colorIds[2]
    act(() => result.current.deleteAt(1))
    expect(result.current.colorIds[1]).toBe(survivingId)
    expect(result.current.lockedStates).toEqual([false, true])

    act(() => result.current.undo())
    expect(result.current.colorIds[2]).toBe(survivingId)
    expect(result.current.lockedStates).toEqual([false, false, true])

    act(() => result.current.redo())
    expect(result.current.colorIds[1]).toBe(survivingId)
    expect(result.current.lockedStates).toEqual([false, true])
  })

  it('applies preset colors atomically and clears locks across retained history', () => {
    seedHistory([['#111111', '#222222', '#333333']])
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.toggleLockAt(0))
    act(() => result.current.applyPresetColors([
      '#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd', '#eeeeee',
    ]))

    expect(result.current.colorIds.slice(0, 3)).toEqual(originalIds)
    expect(result.current.colorIds).toHaveLength(5)
    expect(result.current.lockedStates).toEqual(new Array(5).fill(false))

    act(() => result.current.undo())
    expect(result.current.colorIds).toEqual(originalIds)
    expect(result.current.lockedStates).toEqual(new Array(3).fill(false))
  })

  it('keeps locks attached when a direct delete regenerates row-crossing ids', () => {
    const colors = ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666']
    seedHistory([colors])
    const { result } = renderHook(() => usePaletteColors())
    const originalIds = result.current.colorIds

    act(() => result.current.toggleLockAt(4))
    act(() => result.current.deleteAt(0))

    expect(result.current.current).toEqual(colors.slice(1))
    expect(result.current.colorIds).toHaveLength(5)
    expect(new Set(result.current.colorIds).size).toBe(5)
    expect(result.current.colorIds[3]).not.toBe(originalIds[4])
    expect(result.current.lockedStates).toEqual([false, false, false, true, false])
  })

  it('clears the current lock registry when pushing a fresh replacement', () => {
    seedHistory([['#111111', '#222222']])
    const { result } = renderHook(() => usePaletteColors())

    act(() => result.current.toggleLockAt(0))
    act(() => result.current.pushFresh(['#aaaaaa']))
    expect(result.current.lockedStates).toEqual([false])

    act(() => result.current.undo())
    expect(result.current.lockedStates).toEqual([false, false])
  })
})
