import { useCallback, useRef } from 'react'

export function useFocusReturn() {
  const returnTargetRef = useRef<HTMLElement | null>(null)

  const captureFocus = useCallback(() => {
    returnTargetRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  }, [])

  const restoreFocus = useCallback(() => {
    const returnTarget = returnTargetRef.current
    returnTargetRef.current = null

    requestAnimationFrame(() => {
      if (returnTarget?.isConnected) returnTarget.focus()
    })
  }, [])

  return { captureFocus, restoreFocus }
}
