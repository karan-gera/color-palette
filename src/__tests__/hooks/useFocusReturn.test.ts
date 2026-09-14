import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFocusReturn } from '@/hooks/useFocusReturn'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFocusReturn', () => {
  it('restores the element focused before a dialog opened', () => {
    const trigger = document.createElement('button')
    const dialogControl = document.createElement('button')
    document.body.append(trigger, dialogControl)
    trigger.focus()

    const animationFrames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      animationFrames.push(callback)
      return animationFrames.length
    })

    const { result } = renderHook(() => useFocusReturn())

    act(() => result.current.captureFocus())
    dialogControl.focus()
    act(() => result.current.restoreFocus())

    expect(document.activeElement).toBe(dialogControl)
    act(() => animationFrames.shift()?.(0))
    expect(document.activeElement).toBe(trigger)
  })

  it('does not focus a captured element that was removed', () => {
    const trigger = document.createElement('button')
    const fallback = document.createElement('button')
    document.body.append(trigger, fallback)
    trigger.focus()

    const animationFrames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      animationFrames.push(callback)
      return animationFrames.length
    })

    const { result } = renderHook(() => useFocusReturn())

    act(() => result.current.captureFocus())
    trigger.remove()
    fallback.focus()
    act(() => result.current.restoreFocus())
    act(() => animationFrames.shift()?.(0))

    expect(document.activeElement).toBe(fallback)
  })
})
