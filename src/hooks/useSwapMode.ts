import { useState, useCallback, type Dispatch, type SetStateAction } from 'react'

type Params = {
  swapColors: (indexA: number, indexB: number) => void
  setEditIndex: Dispatch<SetStateAction<number | null>>
}

export type UseSwapModeReturn = {
  swapMode: boolean
  swapSelection: number | null
  toggleSwapMode: () => void
  handleSwapClick: (index: number) => void
  close: () => void
}

export function useSwapMode({ swapColors, setEditIndex }: Params): UseSwapModeReturn {
  const [swapMode, setSwapMode] = useState(false)
  const [swapSelection, setSwapSelection] = useState<number | null>(null)

  const toggleSwapMode = useCallback(() => {
    setSwapMode(prev => {
      if (!prev) {
        setEditIndex(null)
      }
      setSwapSelection(null)
      return !prev
    })
  }, [setEditIndex])

  const handleSwapClick = useCallback((index: number) => {
    if (swapSelection === null) {
      setSwapSelection(index)
    } else if (swapSelection === index) {
      setSwapSelection(null)
    } else {
      swapColors(swapSelection, index)
      setSwapSelection(null)
    }
  }, [swapSelection, swapColors])

  const close = useCallback(() => {
    setSwapMode(false)
    setSwapSelection(null)
  }, [])

  return { swapMode, swapSelection, toggleSwapMode, handleSwapClick, close }
}
