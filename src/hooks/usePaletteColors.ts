import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from '@/hooks/useHistory'
import { loadPersistedHistory, persistHistory, type PaletteHistorySnapshot } from '@/helpers/storage'
import {
  generateRelatedColor,
  MAX_COLORS,
  getPresetColorIdKeepCount,
  getRowSplit,
  type ColorRelationship,
} from '@/helpers/colorTheory'
import { decodePaletteFromUrl, clearUrlParams } from '@/helpers/urlShare'

const RELATIONSHIP_MODES: ColorRelationship[] = [
  'random', 'complementary', 'analogous', 'triadic',
  'tetradic', 'split-complementary', 'monochromatic',
]

type LocksById = Record<string, boolean>

export type UsePaletteColorsReturn = {
  history: string[][]
  historyIndex: number
  current: string[] | undefined
  canUndo: boolean
  canRedo: boolean
  navigationEpoch: number
  undo: () => void
  redo: () => void
  jumpTo: (index: number) => void
  commitColorValues: (colors: string[]) => void
  pushFresh: (colors: string[]) => void
  applyPresetColors: (colors: string[]) => void
  replacePalette: (colors: string[], locked: boolean[]) => void
  lockedStates: boolean[]
  colorIds: string[]
  globalRelationship: ColorRelationship
  addColor: () => void
  rerollAt: (index: number) => void
  rerollAll: () => void
  deleteAt: (index: number) => void
  toggleLockAt: (index: number) => void
  reorderColors: (fromIndex: number, toIndex: number) => void
  swapColors: (indexA: number, indexB: number) => void
  handleRelationshipChange: (relationship: ColorRelationship) => void
  cycleRelationship: () => void
  addPickedColor: (hex: string) => void
}

function createIds(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID())
}

function createSnapshot(colors: string[], ids: string[]): PaletteHistorySnapshot {
  return { colors, ids }
}

function hasDifferentTopology(
  previous: PaletteHistorySnapshot | undefined,
  next: PaletteHistorySnapshot | undefined,
): boolean {
  if (!previous || !next) return previous !== next
  return previous.ids.length !== next.ids.length
    || previous.ids.some((id, index) => id !== next.ids[index])
}

export function usePaletteColors(): UsePaletteColorsReturn {
  const [persistedHistory] = useState(() =>
    loadPersistedHistory() ?? { history: [] as PaletteHistorySnapshot[], index: -1 }
  )
  const {
    history: snapshots,
    index: historyIndex,
    current: currentSnapshot,
    canUndo,
    canRedo,
    navigationEpoch,
    push: pushSnapshot,
    undo,
    redo,
    replace: replaceSnapshots,
    jumpTo,
  } = useHistory<PaletteHistorySnapshot>({
    initialHistory: persistedHistory.history,
    initialIndex: persistedHistory.index,
    shouldResetNavigation: hasDifferentTopology,
  })

  const [urlLoaded, setUrlLoaded] = useState(false)
  const [globalRelationship, setGlobalRelationship] = useState<ColorRelationship>('random')
  const [locksById, setLocksById] = useState<LocksById>({})

  const history = useMemo(() => snapshots.map(snapshot => snapshot.colors), [snapshots])
  const current = currentSnapshot?.colors
  const colorIds = useMemo(() => currentSnapshot?.ids ?? [], [currentSnapshot])
  const lockedStates = colorIds.map(id => locksById[id] ?? false)

  const setLocksForIds = useCallback((ids: string[], locked: boolean[]) => {
    setLocksById(previous => {
      const next = { ...previous }
      ids.forEach((id, index) => { next[id] = locked[index] ?? false })
      return next
    })
  }, [])

  const commitColorValues = useCallback((colors: string[]) => {
    if (colors.length !== colorIds.length) {
      throw new Error('commitColorValues requires an unchanged palette size')
    }
    pushSnapshot(createSnapshot(colors, colorIds))
  }, [colorIds, pushSnapshot])

  const pushFresh = useCallback((colors: string[]) => {
    const ids = createIds(colors.length)
    pushSnapshot(createSnapshot(colors, ids))
    setLocksById({})
  }, [pushSnapshot])

  const applyPresetColors = useCallback((colors: string[]) => {
    const keepCount = getPresetColorIdKeepCount(colorIds.length, colors.length)
    const ids = [...colorIds.slice(0, keepCount), ...createIds(colors.length - keepCount)]
    pushSnapshot(createSnapshot(colors, ids))
    setLocksById({})
  }, [colorIds, pushSnapshot])

  const replacePalette = useCallback((colors: string[], locked: boolean[]) => {
    const keepCount = getPresetColorIdKeepCount(colorIds.length, colors.length)
    const ids = [...colorIds.slice(0, keepCount), ...createIds(colors.length - keepCount)]
    replaceSnapshots([createSnapshot(colors, ids)], 0)
    setLocksById(Object.fromEntries(ids.map((id, index) => [id, locked[index] ?? false])))
  }, [colorIds, replaceSnapshots])

  useEffect(() => {
    if (urlLoaded) return
    const shared = decodePaletteFromUrl()
    if (shared && shared.colors.length > 0) {
      const ids = createIds(shared.colors.length)
      replaceSnapshots([createSnapshot(shared.colors, ids)], 0)
      setLocksForIds(ids, shared.lockedStates)
      clearUrlParams()
    }
    setUrlLoaded(true)
  }, [urlLoaded, replaceSnapshots, setLocksForIds])

  useEffect(() => {
    persistHistory(snapshots, historyIndex)
  }, [snapshots, historyIndex])

  const addColor = useCallback(() => {
    const base = current ?? []
    if (base.length >= MAX_COLORS) return
    const lockedColors = base.filter((_, index) => lockedStates[index])
    const nextColor = generateRelatedColor(lockedColors, globalRelationship, base[base.length - 1])
    pushSnapshot(createSnapshot([...base, nextColor], [...colorIds, crypto.randomUUID()]))
  }, [colorIds, current, globalRelationship, lockedStates, pushSnapshot])

  const rerollAt = useCallback((index: number) => {
    const base = current ?? []
    if (!base[index] || lockedStates[index]) return
    const lockedColors = base.filter((_, colorIndex) => lockedStates[colorIndex])
    const colors = [...base]
    colors[index] = generateRelatedColor(lockedColors, globalRelationship, base[index])
    commitColorValues(colors)
  }, [commitColorValues, current, globalRelationship, lockedStates])

  const rerollAll = useCallback(() => {
    const base = current ?? []
    if (base.length === 0 || base.every((_, index) => lockedStates[index])) return
    const lockedColors = base.filter((_, index) => lockedStates[index])
    const needsSeed = lockedColors.length === 0 && globalRelationship !== 'random'
    const seed = needsSeed
      ? '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
      : null
    const reference = seed ? [seed] : lockedColors
    let seedPlaced = false
    const colors = base.map((color, index) => {
      if (lockedStates[index]) return color
      if (seed && !seedPlaced) {
        seedPlaced = true
        return seed
      }
      return generateRelatedColor(reference, globalRelationship, color)
    })
    commitColorValues(colors)
  }, [commitColorValues, current, globalRelationship, lockedStates])

  const deleteAt = useCallback((index: number) => {
    const base = current ?? []
    const colors = base.filter((_, colorIndex) => colorIndex !== index)
    let ids = colorIds.filter((_, colorIndex) => colorIndex !== index)
    const [oldRow1Count] = getRowSplit(base.length)
    const [newRow1Count] = getRowSplit(colors.length)

    if (oldRow1Count !== newRow1Count) {
      const crossStart = Math.min(oldRow1Count, newRow1Count)
      const crossEnd = Math.max(oldRow1Count, newRow1Count)
      const replacements: Array<[string, string]> = []
      ids = ids.map((id, colorIndex) => {
        if (colorIndex < crossStart || colorIndex >= crossEnd) return id
        const replacement = crypto.randomUUID()
        replacements.push([id, replacement])
        return replacement
      })
      if (replacements.length > 0) {
        setLocksById(previous => {
          const next = { ...previous }
          replacements.forEach(([oldId, newId]) => { next[newId] = previous[oldId] ?? false })
          return next
        })
      }
    }

    pushSnapshot(createSnapshot(colors, ids))
  }, [colorIds, current, pushSnapshot])

  const toggleLockAt = useCallback((index: number) => {
    const id = colorIds[index]
    if (!id) return
    setLocksById(previous => ({ ...previous, [id]: !(previous[id] ?? false) }))
  }, [colorIds])

  const reorderColors = useCallback((fromIndex: number, toIndex: number) => {
    const base = current ?? []
    if (fromIndex === toIndex) return
    const colors = [...base]
    const [movedColor] = colors.splice(fromIndex, 1)
    colors.splice(toIndex, 0, movedColor)
    const ids = [...colorIds]
    const [movedId] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, movedId)
    pushSnapshot(createSnapshot(colors, ids))
  }, [colorIds, current, pushSnapshot])

  const swapColors = useCallback((indexA: number, indexB: number) => {
    const base = current ?? []
    if (indexA === indexB) return
    const colors = [...base]
    ;[colors[indexA], colors[indexB]] = [colors[indexB], colors[indexA]]
    const ids = [...colorIds]
    ;[ids[indexA], ids[indexB]] = [ids[indexB], ids[indexA]]
    pushSnapshot(createSnapshot(colors, ids))
  }, [colorIds, current, pushSnapshot])

  const handleRelationshipChange = useCallback((relationship: ColorRelationship) => {
    setGlobalRelationship(relationship)
    const base = current ?? []
    if (base.length === 0) return
    const lockedColors = base.filter((_, index) => lockedStates[index])
    const needsSeed = lockedColors.length === 0 && relationship !== 'random'
    const seed = needsSeed
      ? '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
      : null
    const reference = seed ? [seed] : lockedColors
    let seedPlaced = false
    const colors = base.map((color, index) => {
      if (lockedStates[index]) return color
      if (seed && !seedPlaced) {
        seedPlaced = true
        return seed
      }
      return generateRelatedColor(reference, relationship, color)
    })
    commitColorValues(colors)
  }, [commitColorValues, current, lockedStates])

  const cycleRelationship = useCallback(() => {
    const index = RELATIONSHIP_MODES.indexOf(globalRelationship)
    handleRelationshipChange(RELATIONSHIP_MODES[(index + 1) % RELATIONSHIP_MODES.length])
  }, [globalRelationship, handleRelationshipChange])

  const addPickedColor = useCallback((hex: string) => {
    const base = current ?? []
    if (base.length >= MAX_COLORS) return
    pushSnapshot(createSnapshot([...base, hex], [...colorIds, crypto.randomUUID()]))
  }, [colorIds, current, pushSnapshot])

  return {
    history,
    historyIndex,
    current,
    canUndo,
    canRedo,
    navigationEpoch,
    undo,
    redo,
    jumpTo,
    commitColorValues,
    pushFresh,
    applyPresetColors,
    replacePalette,
    lockedStates,
    colorIds,
    globalRelationship,
    addColor,
    rerollAt,
    rerollAll,
    deleteAt,
    toggleLockAt,
    reorderColors,
    swapColors,
    handleRelationshipChange,
    cycleRelationship,
    addPickedColor,
  }
}
