import { useCallback, useState } from 'react'

export interface CircleWipeState {
  isAnimating: boolean
  origin: { x: number; y: number }
  targetFilter: string
  onComplete: () => void
}

/**
 * Hook to manage circle wipe transition animation state.
 * 
 * Usage:
 * 1. Call startWipe() with click coordinates and target filter
 * 2. Overlay component reads state and animates clip-path
 * 3. When animation ends, overlay calls onComplete() which triggers completeWipe()
 */
export function useCircleWipe() {
  const [wipeState, setWipeState] = useState<CircleWipeState | null>(null)

  const startWipe = useCallback((
    origin: { x: number; y: number },
    targetFilter: string,
    onComplete: () => void
  ) => {
    setWipeState({
      isAnimating: true,
      origin,
      targetFilter,
      onComplete,
    })
  }, [])

  const completeWipe = useCallback(() => {
    if (wipeState?.onComplete) {
      wipeState.onComplete()
    }
    setWipeState(null)
  }, [wipeState])

  return {
    wipeState,
    startWipe,
    completeWipe,
  }
}

/**
 * Calculate the maximum radius needed to cover the entire viewport
 * from a given origin point.
 */
export function calculateMaxRadius(origin: { x: number; y: number }): number {
  const vw = window.innerWidth
  const vh = window.innerHeight
  
  // Calculate distance to each corner
  const distances = [
    Math.hypot(origin.x, origin.y),                    // top-left
    Math.hypot(vw - origin.x, origin.y),               // top-right
    Math.hypot(origin.x, vh - origin.y),               // bottom-left
    Math.hypot(vw - origin.x, vh - origin.y),          // bottom-right
  ]
  
  // Return the maximum distance (plus a small buffer)
  return Math.max(...distances) + 50
}
