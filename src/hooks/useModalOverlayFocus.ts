import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

type UseModalOverlayFocusOptions = {
  onClose: () => void
  active?: boolean
}

export function useModalOverlayFocus({
  onClose,
  active = true,
}: UseModalOverlayFocusOptions): RefObject<HTMLDivElement | null> {
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    const overlay = overlayRef.current
    if (!overlay) return

    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && !overlay.contains(activeElement)) {
      previousFocusRef.current = activeElement
    }

    const focusInitialControl = window.requestAnimationFrame(() => {
      const initialControl = overlay.querySelector<HTMLElement>('[data-overlay-initial-focus]')
      ;(initialControl ?? overlay).focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true')

      if (focusableElements.length === 0) {
        event.preventDefault()
        overlay.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const focusIsOutsideOverlay = !overlay.contains(document.activeElement)

      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutsideOverlay)) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutsideOverlay)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusInitialControl)
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
      previousFocusRef.current = null
    }
  }, [active, onClose])

  return overlayRef
}
