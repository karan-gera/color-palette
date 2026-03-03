import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useHistory } from '@/hooks/useHistory'
import { loadPersistedHistory, persistHistory } from '@/helpers/storage'
import { generateRelatedColor, MAX_COLORS, getRowSplit, type ColorRelationship } from '@/helpers/colorTheory'
import { decodePaletteFromUrl, clearUrlParams } from '@/helpers/urlShare'

const RELATIONSHIP_MODES: ColorRelationship[] = [
  'random', 'complementary', 'analogous', 'triadic',
  'tetradic', 'split-complementary', 'monochromatic',
]

export type ColorMeta = { locked: boolean[]; ids: string[] }

export type UsePaletteColorsReturn = {
  // History passthrough
  history: string[][]
  historyIndex: number
  current: string[] | undefined
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  jumpTo: (index: number) => void
  push: (colors: string[]) => void
  replace: (nextHistory: string[][], nextIndex?: number) => void
  // Color meta
  lockedStates: boolean[]
  colorIds: string[]
  setColorMeta: Dispatch<SetStateAction<ColorMeta>>
  // Relationship
  globalRelationship: ColorRelationship
  // Color operations
  addColor: () => void
  rerollAt: (index: number) => void
  rerollAll: () => void
  deleteAt: (index: number) => void
  toggleLockAt: (index: number) => void
  reorderColors: (fromIndex: number, toIndex: number) => void
  handleRelationshipChange: (relationship: ColorRelationship) => void
  cycleRelationship: () => void
  addPickedColor: (hex: string) => void
}

export function usePaletteColors(): UsePaletteColorsReturn {
  const [persistedHistory] = useState(() =>
    loadPersistedHistory() ?? { history: [] as string[][], index: -1 }
  )
  const {
    history,
    index: historyIndex,
    current,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    replace,
    jumpTo,
  } = useHistory<string[]>({ initialHistory: persistedHistory.history, initialIndex: persistedHistory.index })

  const [urlLoaded, setUrlLoaded] = useState(false)
  const [globalRelationship, setGlobalRelationship] = useState<ColorRelationship>('random')
  const [colorMeta, setColorMeta] = useState<ColorMeta>(() => {
    const currentPalette = persistedHistory.index >= 0
      ? (persistedHistory.history[persistedHistory.index] ?? [])
      : []
    return {
      locked: currentPalette.map(() => false),
      ids: currentPalette.map(() => crypto.randomUUID()),
    }
  })
  const { locked: lockedStates, ids: colorIds } = colorMeta

  // Load palette from URL on mount
  useEffect(() => {
    if (urlLoaded) return
    const shared = decodePaletteFromUrl()
    if (shared && shared.colors.length > 0) {
      replace([shared.colors], 0)
      setColorMeta({ locked: shared.lockedStates, ids: shared.colors.map(() => crypto.randomUUID()) })
      clearUrlParams()
    }
    setUrlLoaded(true)
  }, [urlLoaded, replace])

  // Persist undo/redo history to localStorage
  useEffect(() => {
    persistHistory(history, historyIndex)
  }, [history, historyIndex])

  // After an expired-session restore via history strip, colorMeta.ids will be empty.
  // Regenerate them so the restored palette has stable React keys.
  useEffect(() => {
    if (!current || current.length === 0) return
    setColorMeta(prev => {
      if (prev.ids.length > 0) return prev
      return {
        locked: current.map(() => false),
        ids: current.map(() => crypto.randomUUID()),
      }
    })
  }, [current])

  const addColor = useCallback(() => {
    const base = current ?? []
    if (base.length >= MAX_COLORS) return
    const lockedColors = base.filter((_, i) => lockedStates[i])
    const nextColor = generateRelatedColor(lockedColors, globalRelationship, base[base.length - 1])
    push([...base, nextColor])
    setColorMeta(prev => ({ locked: [...prev.locked, false], ids: [...prev.ids, crypto.randomUUID()] }))
  }, [current, globalRelationship, lockedStates, push])

  const rerollAt = useCallback((index: number) => {
    const base = current ?? []
    if (!base[index] || lockedStates[index]) return
    const lockedColors = base.filter((_, i) => lockedStates[i])
    const next = [...base]
    next[index] = generateRelatedColor(lockedColors, globalRelationship, base[index])
    push(next)
  }, [current, globalRelationship, lockedStates, push])

  const rerollAll = useCallback(() => {
    const base = current ?? []
    if (base.length === 0) return
    if (base.every((_, i) => lockedStates[i])) return
    const lockedColors = base.filter((_, i) => lockedStates[i])
    const next = base.map((color, index) =>
      lockedStates[index] ? color : generateRelatedColor(lockedColors, globalRelationship, color)
    )
    push(next)
  }, [current, globalRelationship, lockedStates, push])

  const deleteAt = useCallback((index: number) => {
    const base = current ?? []
    const next = base.filter((_, i) => i !== index)
    push(next)
    setColorMeta(prev => {
      const filteredLocked = prev.locked.filter((_, i) => i !== index)
      const filteredIds = prev.ids.filter((_, i) => i !== index)
      const [oldRow1Count] = getRowSplit(base.length)
      const [newRow1Count] = getRowSplit(next.length)
      // When the row split changes, items that cross between rows would trigger a
      // cross-parent layoutId flight animation. That keeps the source row populated
      // (and thus tall) for the full spring duration, blocking the layout shift that
      // lets GlobalColorRelationshipSelector animate upward. Break the layoutId
      // connection by giving crossing items new IDs so they simply exit/enter in place.
      if (oldRow1Count !== newRow1Count) {
        const crossStart = Math.min(oldRow1Count, newRow1Count)
        const crossEnd   = Math.max(oldRow1Count, newRow1Count)
        return { locked: filteredLocked, ids: filteredIds.map((id, i) => (i >= crossStart && i < crossEnd ? crypto.randomUUID() : id)) }
      }
      return { locked: filteredLocked, ids: filteredIds }
    })
  }, [current, push])

  const toggleLockAt = useCallback((index: number) => {
    setColorMeta(prev => {
      const next = [...prev.locked]
      next[index] = !next[index]
      return { ...prev, locked: next }
    })
  }, [])

  const reorderColors = useCallback((fromIndex: number, toIndex: number) => {
    const base = current ?? []
    if (fromIndex === toIndex) return
    const newColors = [...base]
    const [moved] = newColors.splice(fromIndex, 1)
    newColors.splice(toIndex, 0, moved)
    push(newColors)
    setColorMeta(prev => {
      const nextLocked = [...prev.locked]
      const [movedLock] = nextLocked.splice(fromIndex, 1)
      nextLocked.splice(toIndex, 0, movedLock)
      const nextIds = [...prev.ids]
      const [movedId] = nextIds.splice(fromIndex, 1)
      nextIds.splice(toIndex, 0, movedId)
      return { locked: nextLocked, ids: nextIds }
    })
  }, [current, push])

  const handleRelationshipChange = useCallback((relationship: ColorRelationship) => {
    setGlobalRelationship(relationship)
    const base = current ?? []
    if (base.length > 0) {
      const lockedColors = base.filter((_, i) => lockedStates[i])
      const next = base.map((color, index) =>
        lockedStates[index] ? color : generateRelatedColor(lockedColors, relationship, color)
      )
      push(next)
    }
  }, [current, lockedStates, push])

  const cycleRelationship = useCallback(() => {
    const idx = RELATIONSHIP_MODES.indexOf(globalRelationship)
    handleRelationshipChange(RELATIONSHIP_MODES[(idx + 1) % RELATIONSHIP_MODES.length])
  }, [globalRelationship, handleRelationshipChange])

  const addPickedColor = useCallback((hex: string) => {
    const base = current ?? []
    if (base.length >= MAX_COLORS) return
    push([...base, hex])
    setColorMeta(prev => ({ locked: [...prev.locked, false], ids: [...prev.ids, crypto.randomUUID()] }))
  }, [current, push])

  return {
    history,
    historyIndex,
    current,
    canUndo,
    canRedo,
    undo,
    redo,
    jumpTo,
    push,
    replace,
    lockedStates,
    colorIds,
    setColorMeta,
    globalRelationship,
    addColor,
    rerollAt,
    rerollAll,
    deleteAt,
    toggleLockAt,
    reorderColors,
    handleRelationshipChange,
    cycleRelationship,
    addPickedColor,
  }
}
