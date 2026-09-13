import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useModalOverlayFocus } from '@/hooks/useModalOverlayFocus'

function createOverlay() {
  const overlay = document.createElement('div')
  overlay.tabIndex = -1

  const first = document.createElement('button')
  first.textContent = 'first'
  first.dataset.overlayInitialFocus = ''

  const last = document.createElement('button')
  last.textContent = 'last'

  overlay.append(first, last)
  document.body.append(overlay)
  return { overlay, first, last }
}

function renderOverlayHook(overlay: HTMLDivElement, onClose = vi.fn()) {
  const hook = renderHook(
    ({ active }) => useModalOverlayFocus({ onClose, active }),
    { initialProps: { active: false } },
  )

  act(() => {
    hook.result.current.current = overlay
  })
  hook.rerender({ active: true })

  return { ...hook, onClose }
}

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0)
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
})

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('useModalOverlayFocus', () => {
  it('focuses the requested initial control', () => {
    const { overlay, first } = createOverlay()

    const { unmount } = renderOverlayHook(overlay)

    expect(first).toHaveFocus()
    unmount()
  })

  it('traps forward and reverse tab navigation', () => {
    const { overlay, first, last } = createOverlay()
    const { unmount } = renderOverlayHook(overlay)

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    unmount()
  })

  it('closes on escape and restores the opener on unmount', () => {
    const opener = document.createElement('button')
    opener.textContent = 'open preview'
    document.body.append(opener)
    opener.focus()
    const { overlay } = createOverlay()
    const onClose = vi.fn()
    const { unmount } = renderOverlayHook(overlay, onClose)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()

    unmount()
    expect(opener).toHaveFocus()
  })

  it('keeps focus on the overlay when it has no controls', () => {
    const overlay = document.createElement('div')
    overlay.tabIndex = -1
    document.body.append(overlay)
    const { unmount } = renderOverlayHook(overlay)

    document.body.focus()
    fireEvent.keyDown(document, { key: 'Tab' })

    expect(overlay).toHaveFocus()
    unmount()
  })
})
