import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useListKeyboardNav } from '@/hooks/useListKeyboardNav'

function pressKey(key: string, target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

describe('useListKeyboardNav', () => {
  it('moves the selection and reports the new index', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() => useListKeyboardNav({
      count: 4,
      onEnter: vi.fn(),
      onNavigate,
    }))

    pressKey('ArrowDown')

    expect(result.current.selectedIndex).toBe(1)
    expect(onNavigate).toHaveBeenCalledWith(1)
  })

  it('uses the selected index when Enter is pressed after navigation', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() => useListKeyboardNav({ count: 4, onEnter }))

    pressKey('ArrowDown')
    pressKey('ArrowDown')
    pressKey('Enter')

    expect(result.current.selectedIndex).toBe(2)
    expect(onEnter).toHaveBeenCalledOnce()
    expect(onEnter).toHaveBeenCalledWith(2)
  })

  it('does not navigate past either end of the list', () => {
    const onNavigate = vi.fn()
    const { result } = renderHook(() => useListKeyboardNav({
      count: 2,
      onEnter: vi.fn(),
      onNavigate,
    }))

    pressKey('ArrowUp')
    expect(result.current.selectedIndex).toBe(0)

    pressKey('ArrowDown')
    pressKey('ArrowDown')
    expect(result.current.selectedIndex).toBe(1)
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('ignores keyboard input while disabled', () => {
    const onEnter = vi.fn()
    const onNavigate = vi.fn()
    const { result } = renderHook(() => useListKeyboardNav({
      count: 3,
      onEnter,
      onNavigate,
      enabled: false,
    }))

    pressKey('ArrowDown')
    pressKey('Enter')

    expect(result.current.selectedIndex).toBe(0)
    expect(onNavigate).not.toHaveBeenCalled()
    expect(onEnter).not.toHaveBeenCalled()
  })

  it('does not treat Backspace in an input as a delete command', () => {
    const onDelete = vi.fn()
    renderHook(() => useListKeyboardNav({
      count: 3,
      onEnter: vi.fn(),
      onDelete,
    }))
    const input = document.createElement('input')
    document.body.append(input)

    pressKey('Backspace', input)

    expect(onDelete).not.toHaveBeenCalled()
    input.remove()
  })
})
