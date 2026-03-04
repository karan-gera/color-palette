import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react'
import type { UseGradientStopsReturn } from '@/hooks/useGradientStops'

type Params = {
  current: string[] | undefined
  colorIds: string[]
  gradientState: UseGradientStopsReturn
  setNotification: (msg: string) => void
}

export type UseViewNavigationReturn = {
  activeView: 'palette' | 'gradient' | 'extract'
  showPreviewOverlay: boolean
  setShowPreviewOverlay: Dispatch<SetStateAction<boolean>>
  showGradientPreviewOverlay: boolean
  setShowGradientPreviewOverlay: Dispatch<SetStateAction<boolean>>
  gradientPreviewRatio: number
  setGradientPreviewRatio: Dispatch<SetStateAction<number>>
  handleSwitchView: (view: 'palette' | 'gradient' | 'extract') => void
  handleToggleView: () => void
  handleTogglePreview: () => void
  handleToggleExtract: () => void
  handleRedrawGradient: () => void
  closePreviews: () => void
}

export function useViewNavigation({ current, colorIds, gradientState, setNotification }: Params): UseViewNavigationReturn {
  const [activeView, setActiveView] = useState<'palette' | 'gradient' | 'extract'>('palette')
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false)
  const [showGradientPreviewOverlay, setShowGradientPreviewOverlay] = useState(false)
  const [gradientPreviewRatio, setGradientPreviewRatio] = useState(() => {
    const stored = localStorage.getItem('color-palette:gradient-ratio')
    return stored ? parseFloat(stored) : 16 / 9
  })

  useEffect(() => {
    localStorage.setItem('color-palette:gradient-ratio', String(gradientPreviewRatio))
  }, [gradientPreviewRatio])

  const handleSwitchView = useCallback((view: 'palette' | 'gradient' | 'extract') => {
    if (view === 'gradient' && gradientState.stops.length < 2) {
      if ((current ?? []).length === 0) {
        setNotification('add colors to the palette first')
        return
      }
      gradientState.resetToPalette(current ?? [], colorIds)
    }
    setActiveView(view)
  }, [current, colorIds, gradientState, setNotification])

  const handleToggleView = useCallback(() => {
    const cycle: Array<'palette' | 'gradient' | 'extract'> = ['palette', 'gradient', 'extract']
    const next = cycle[(cycle.indexOf(activeView) + 1) % cycle.length]
    handleSwitchView(next)
  }, [activeView, handleSwitchView])

  const handleTogglePreview = useCallback(() => {
    if (activeView === 'gradient') {
      setShowGradientPreviewOverlay(v => !v)
    } else if (activeView === 'palette') {
      setShowPreviewOverlay(v => !v)
    }
  }, [activeView])

  const handleToggleExtract = useCallback(() => {
    handleSwitchView(activeView === 'extract' ? 'palette' : 'extract')
  }, [activeView, handleSwitchView])

  const handleRedrawGradient = useCallback(() => {
    gradientState.resetToPalette(current ?? [], colorIds)
  }, [current, colorIds, gradientState])

  const closePreviews = useCallback(() => {
    setShowPreviewOverlay(false)
    setShowGradientPreviewOverlay(false)
  }, [])

  return {
    activeView,
    showPreviewOverlay,
    setShowPreviewOverlay,
    showGradientPreviewOverlay,
    setShowGradientPreviewOverlay,
    gradientPreviewRatio,
    setGradientPreviewRatio,
    handleSwitchView,
    handleToggleView,
    handleTogglePreview,
    handleToggleExtract,
    handleRedrawGradient,
    closePreviews,
  }
}
