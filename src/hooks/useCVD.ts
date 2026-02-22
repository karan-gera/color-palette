import { useCallback, useEffect, useRef, useState } from 'react'

export type CVDType = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia'

export const CVD_LABELS: Record<CVDType, string> = {
  normal: 'Normal vision',
  deuteranopia: 'Deuteranopia (green-blind)',
  protanopia: 'Protanopia (red-blind)',
  tritanopia: 'Tritanopia (blue-yellow)',
  achromatopsia: 'Achromatopsia (monochrome)',
}

const STORAGE_KEY = 'color-palette:cvd'
const TRANSITION_DURATION = 150

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

function applyDataAttribute(cvd: CVDType) {
  if (cvd === 'normal') {
    document.documentElement.removeAttribute('data-cvd')
  } else {
    document.documentElement.setAttribute('data-cvd', cvd)
  }
}

export function useCVD() {
  const [cvd, setCVDState] = useState<CVDType>(getInitialCVD)
  const transitionTimeoutRef = useRef<number | null>(null)
  const pendingCVDRef = useRef<CVDType | null>(null)

  const setCVD = useCallback((newCVD: CVDType) => {
    if (newCVD === cvd) return
    
    // If already transitioning, update the pending target
    if (transitionTimeoutRef.current !== null) {
      pendingCVDRef.current = newCVD
      return
    }
    
    // Start fade out
    document.documentElement.setAttribute('data-cvd-transitioning', '')
    
    transitionTimeoutRef.current = window.setTimeout(() => {
      // Apply the new filter while faded out
      setCVDState(newCVD)
      localStorage.setItem(STORAGE_KEY, newCVD)
      applyDataAttribute(newCVD)
      
      // Start fade in
      document.documentElement.removeAttribute('data-cvd-transitioning')
      
      transitionTimeoutRef.current = window.setTimeout(() => {
        transitionTimeoutRef.current = null
        
        // If there's a pending change, apply it
        if (pendingCVDRef.current !== null && pendingCVDRef.current !== newCVD) {
          const pending = pendingCVDRef.current
          pendingCVDRef.current = null
          setCVD(pending)
        } else {
          pendingCVDRef.current = null
        }
      }, TRANSITION_DURATION)
    }, TRANSITION_DURATION)
  }, [cvd])

  const cycleCVD = useCallback(() => {
    const currentIndex = CVD_TYPES.indexOf(cvd)
    const nextIndex = (currentIndex + 1) % CVD_TYPES.length
    setCVD(CVD_TYPES[nextIndex])
  }, [cvd, setCVD])

  // Apply data attribute on mount (no transition)
  useEffect(() => {
    applyDataAttribute(cvd)
  }, [cvd])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  return { 
    cvd, 
    setCVD, 
    cycleCVD, 
    cvdLabel: CVD_LABELS[cvd],
  }
}
