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

function isValidCVD(value: string | null): value is CVDType {
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
    // Use simple URL reference - works with inline SVG in React
    const filterUrl = `url(#cvd-${cvd})`
    
    // Clear html filter, only use wrapper for consistency
    document.documentElement.style.filter = ''
    if (wrapper) {
      wrapper.style.filter = filterUrl
    }
  }
}

export function useCVD() {
  const [cvd, setCVDState] = useState<CVDType>(getInitialCVD)

  const setCVD = useCallback((newCVD: CVDType) => {
    setCVDState(newCVD)
    localStorage.setItem(STORAGE_KEY, newCVD)
    applyFilter(newCVD)
  }, [])

  const cycleCVD = useCallback(() => {
    const currentIndex = CVD_TYPES.indexOf(cvd)
    const nextIndex = (currentIndex + 1) % CVD_TYPES.length
    setCVD(CVD_TYPES[nextIndex])
  }, [cvd, setCVD])

  // Apply filter on mount
  useEffect(() => {
    applyFilter(cvd)
  }, [cvd])

  return { cvd, setCVD, cycleCVD, cvdLabel: CVD_LABELS[cvd] }
}
