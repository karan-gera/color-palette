import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useUIPanels } from '@/hooks/useUIPanels'

describe('useUIPanels', () => {
  it('starts with the shortcuts tray collapsed on a first visit', () => {
    const { result } = renderHook(() => useUIPanels())

    expect(result.current.showHints).toBe(false)
  })

  it('restores an explicitly opened shortcuts tray', () => {
    localStorage.setItem('color-palette:show-hints', 'true')

    const { result } = renderHook(() => useUIPanels())

    expect(result.current.showHints).toBe(true)
  })

  it('toggles and persists the shortcuts tray', () => {
    const { result } = renderHook(() => useUIPanels())

    act(() => result.current.toggleHints())

    expect(result.current.showHints).toBe(true)
    expect(localStorage.getItem('color-palette:show-hints')).toBe('true')
  })
})
