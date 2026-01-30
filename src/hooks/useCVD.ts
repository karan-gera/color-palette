import { useCallback, useEffect, useState } from 'react'

export type CVDType = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia'

export const CVD_LABELS: Record<CVDType, string> = {
  normal: 'Normal vision',
  deuteranopia: 'Deuteranopia (red-green)',
  protanopia: 'Protanopia (red-green)',
  tritanopia: 'Tritanopia (blue-yellow)',
  achromatopsia: 'Achromatopsia (monochrome)',
}

const STORAGE_KEY = 'color-palette:cvd'

const CVD_TYPES: CVDType[] = ['normal', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia']

export function isValidCVD(value: string | null): value is CVDType {
  return value !== null && CVD_TYPES.includes(value as CVDType)
}

function getInitialCVD(): CVDType {
  if (typeof window === 'undefined') return 'normal'
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (isValidCVD(stored)) {
    return stored
  }
  
  return 'normal'
}

/** Get the CSS filter URL for a CVD type */
export function getCVDFilterUrl(cvd: CVDType): string {
  if (cvd === 'normal') return ''
  return `url(#cvd-${cvd})`
}

function applyFilter(cvd: CVDType) {
  // Only apply to wrapper - consistent across all browsers
  // (Applying to both html AND wrapper causes double-filtering in some browsers)
  const wrapper = document.getElementById('cvd-wrapper')
  
  if (cvd === 'normal') {
    document.documentElement.removeAttribute('data-cvd')
    document.documentElement.style.filter = ''
    if (wrapper) {
      wrapper.style.filter = ''
    }
  } else {
    document.documentElement.setAttribute('data-cvd', cvd)
    const filterUrl = getCVDFilterUrl(cvd)
    
    // Clear html filter, only use wrapper for consistency
    document.documentElement.style.filter = ''
    if (wrapper) {
      wrapper.style.filter = filterUrl
    }
  }
}

export interface CVDTransition {
  from: CVDType
  to: CVDType
  origin: { x: number; y: number }
}

export function useCVD() {
  const [cvd, setCVDState] = useState<CVDType>(getInitialCVD)
  const [transition, setTransition] = useState<CVDTransition | null>(null)

  // Set CVD without animation (used internally after animation completes)
  const setCVDImmediate = useCallback((newCVD: CVDType) => {
    setCVDState(newCVD)
    localStorage.setItem(STORAGE_KEY, newCVD)
    applyFilter(newCVD)
  }, [])

  // Set CVD with circle wipe animation
  const setCVDWithTransition = useCallback((newCVD: CVDType, origin: { x: number; y: number }) => {
    if (newCVD === cvd) return // No change
    if (transition) return // Already transitioning - ignore click
    
    // Start transition - overlay will show new filter expanding
    // Keep OLD filter on wrapper during animation
    setTransition({
      from: cvd,
      to: newCVD,
      origin,
    })
    
    // Update state but DON'T apply filter yet - overlay handles visual
    setCVDState(newCVD)
    localStorage.setItem(STORAGE_KEY, newCVD)
    // Note: applyFilter() is called in applyTransitionTarget, not here
  }, [cvd, transition])

  // Apply the new filter during animation (overlay masks the change)
  const applyTransitionTarget = useCallback(() => {
    if (transition) {
      applyFilter(transition.to)
    }
  }, [transition])

  // Called when animation completes - clear transition state
  const completeTransition = useCallback(() => {
    setTransition(null)
  }, [])

  // Legacy setCVD without animation (for keyboard shortcuts, etc.)
  const setCVD = useCallback((newCVD: CVDType) => {
    setCVDImmediate(newCVD)
  }, [setCVDImmediate])

  const cycleCVD = useCallback(() => {
    const currentIndex = CVD_TYPES.indexOf(cvd)
    const nextIndex = (currentIndex + 1) % CVD_TYPES.length
    setCVD(CVD_TYPES[nextIndex])
  }, [cvd, setCVD])

  // Apply filter on mount (but not during transitions)
  useEffect(() => {
    if (!transition) {
      applyFilter(cvd)
    }
  }, [cvd, transition])

  return { 
    cvd, 
    setCVD, 
    setCVDWithTransition,
    cycleCVD, 
    cvdLabel: CVD_LABELS[cvd],
    // Transition state for overlay component
    transition,
    applyTransitionTarget,
    completeTransition,
  }
}
