import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from '@/hooks/useHistory'

describe('useHistory - initial state', () => {
  it('current is history[initialIndex]', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b', 'c'], initialIndex: 1 })
    )
    expect(result.current.current).toBe('b')
  })

  it('canUndo is false when index is 0', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    expect(result.current.canUndo).toBe(false)
  })

  it('canUndo is true when index > 0', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    expect(result.current.canUndo).toBe(true)
  })

  it('canRedo is false when at end of history', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    expect(result.current.canRedo).toBe(false)
  })

  it('canRedo is true when not at end', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 0 })
    )
    expect(result.current.canRedo).toBe(true)
  })

  it('current is undefined for empty history', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: [], initialIndex: -1 })
    )
    expect(result.current.current).toBeUndefined()
  })

  it('exposes the history array', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['x', 'y'], initialIndex: 0 })
    )
    expect(result.current.history).toEqual(['x', 'y'])
  })
})

describe('useHistory - push', () => {
  it('appends new value and updates current', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.push('b') })
    expect(result.current.current).toBe('b')
    expect(result.current.history).toHaveLength(2)
  })

  it('increments index', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.push('b') })
    expect(result.current.index).toBe(1)
  })

  it('enables canUndo after first push from index 0', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.push('b') })
    expect(result.current.canUndo).toBe(true)
  })

  // CRITICAL: push after undo must truncate future history
  // If it appended instead, undoing and choosing a new branch would still allow
  // redoing the old path — which is incorrect and breaks the undo/redo contract.
  it('push after undo truncates future history', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b', 'c'], initialIndex: 2 })
    )
    act(() => { result.current.undo() })
    act(() => { result.current.undo() })
    expect(result.current.current).toBe('a')

    act(() => { result.current.push('d') })
    expect(result.current.history).toEqual(['a', 'd'])
    expect(result.current.canRedo).toBe(false)
  })

  it('push replaces future so redo is no longer available', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 0 })
    )
    act(() => { result.current.push('c') })
    expect(result.current.history).not.toContain('b')
    expect(result.current.canRedo).toBe(false)
  })

  it('multiple pushes accumulate correctly', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.push('b') })
    act(() => { result.current.push('c') })
    act(() => { result.current.push('d') })
    expect(result.current.history).toEqual(['a', 'b', 'c', 'd'])
    expect(result.current.current).toBe('d')
    expect(result.current.index).toBe(3)
  })
})

describe('useHistory - undo', () => {
  it('decrements index and updates current', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    act(() => { result.current.undo() })
    expect(result.current.current).toBe('a')
    expect(result.current.index).toBe(0)
  })

  it('canUndo becomes false at index 0', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    act(() => { result.current.undo() })
    expect(result.current.canUndo).toBe(false)
  })

  it('undo at index 0 does nothing (no-op)', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.undo() })
    expect(result.current.index).toBe(0)
    expect(result.current.current).toBe('a')
  })

  it('undo enables canRedo', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    act(() => { result.current.undo() })
    expect(result.current.canRedo).toBe(true)
  })
})

describe('useHistory - redo', () => {
  it('increments index and updates current', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 0 })
    )
    act(() => { result.current.redo() })
    expect(result.current.current).toBe('b')
    expect(result.current.index).toBe(1)
  })

  it('redo at end of history does nothing (no-op)', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    act(() => { result.current.redo() })
    expect(result.current.index).toBe(1)
  })

  it('canRedo becomes false after redoing to end', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 0 })
    )
    act(() => { result.current.redo() })
    expect(result.current.canRedo).toBe(false)
  })

  it('redo enables canUndo if it was false', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 0 })
    )
    expect(result.current.canUndo).toBe(false)
    act(() => { result.current.redo() })
    expect(result.current.canUndo).toBe(true)
  })
})

describe('useHistory - replace', () => {
  it('replaces entire history and defaults to last index', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.replace(['x', 'y', 'z']) })
    expect(result.current.history).toEqual(['x', 'y', 'z'])
    expect(result.current.current).toBe('z')
  })

  it('empty array sets index to -1 and current to undefined', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b'], initialIndex: 1 })
    )
    act(() => { result.current.replace([]) })
    expect(result.current.index).toBe(-1)
    expect(result.current.current).toBeUndefined()
  })

  it('respects explicit nextIndex', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.replace(['x', 'y', 'z'], 1) })
    expect(result.current.current).toBe('y')
    expect(result.current.index).toBe(1)
  })

  it('clamps out-of-bounds nextIndex to last valid index', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.replace(['x', 'y'], 99) })
    expect(result.current.index).toBe(1)
    expect(result.current.current).toBe('y')
  })

  it('clamps negative nextIndex to -1', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.replace(['x', 'y'], -5) })
    expect(result.current.index).toBe(-1)
  })
})

describe('useHistory - canUndo/canRedo invariants across sequences', () => {
  it('push → undo → redo restores to pushed state', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.push('b') })
    act(() => { result.current.undo() })
    act(() => { result.current.redo() })
    expect(result.current.current).toBe('b')
  })

  it('both canUndo and canRedo are true in the middle of history', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a', 'b', 'c'], initialIndex: 1 })
    )
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(true)
  })

  it('multiple undo/redo cycles maintain history integrity', () => {
    const { result } = renderHook(() =>
      useHistory({ initialHistory: ['a'], initialIndex: 0 })
    )
    act(() => { result.current.push('b') })
    act(() => { result.current.push('c') })
    act(() => { result.current.undo() })
    act(() => { result.current.undo() })
    expect(result.current.current).toBe('a')
    act(() => { result.current.redo() })
    expect(result.current.current).toBe('b')
    act(() => { result.current.redo() })
    expect(result.current.current).toBe('c')
    expect(result.current.canRedo).toBe(false)
  })
})
