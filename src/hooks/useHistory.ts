import { useCallback, useMemo, useState } from 'react'

type UseHistoryArgs<T> = {
  initialHistory: T[]
  initialIndex: number
}

type UseHistoryReturn<T> = {
  history: T[]
  index: number
  current: T | undefined
  canUndo: boolean
  canRedo: boolean
  push: (value: T) => void
  undo: () => void
  redo: () => void
  replace: (nextHistory: T[], nextIndex?: number) => void
}

export function useHistory<T>({ initialHistory, initialIndex }: UseHistoryArgs<T>): UseHistoryReturn<T> {
  const [history, setHistory] = useState<T[]>(initialHistory)
  const [index, setIndex] = useState<number>(initialIndex)

  const current = useMemo(() => history[index], [history, index])
  const canUndo = index > 0
  const canRedo = index >= 0 && index < history.length - 1

  const push = useCallback((value: T) => {
    setHistory((prevHistory) => {
      const nextHistory = index < prevHistory.length - 1 ? prevHistory.slice(0, index + 1) : prevHistory
      const updated = [...nextHistory, value]
      return updated
    })
    setIndex((prevIndex) => prevIndex + 1)
  }, [index])

  const undo = useCallback(() => {
    setIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex))
  }, [])

  const redo = useCallback(() => {
    setIndex((prevIndex) => (prevIndex < history.length - 1 ? prevIndex + 1 : prevIndex))
  }, [history.length])

  const replace = useCallback((nextHistory: T[], nextIndex?: number) => {
    setHistory(nextHistory)
    if (nextHistory.length === 0) {
      setIndex(-1)
      return
    }
    const targetIndex = typeof nextIndex === 'number' ? nextIndex : nextHistory.length - 1
    const boundedIndex = Math.max(-1, Math.min(targetIndex, nextHistory.length - 1))
    setIndex(boundedIndex)
  }, [])

  return { history, index, current, canUndo, canRedo, push, undo, redo, replace }
}


