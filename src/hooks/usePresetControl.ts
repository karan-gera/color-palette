import { useMemo, useCallback, type Dispatch, type SetStateAction } from 'react'
import { generatePresetPalette, PALETTE_PRESETS, isPresetActive, shouldWarnBeforePreset, getPresetColorIdKeepCount } from '@/helpers/colorTheory'
import type { ColorMeta } from '@/hooks/usePaletteColors'

type Params = {
  current: string[] | undefined
  lockedStates: boolean[]
  push: (colors: string[]) => void
  setColorMeta: Dispatch<SetStateAction<ColorMeta>>
  onNeedsConfirmation: (presetId: string) => void
}

export type UsePresetControlReturn = {
  activePresetId: string | null
  applyPreset: (presetId: string) => void
  handlePresetSelect: (presetId: string) => void
  rerollPreset: () => void
  cyclePreset: () => void
}

export function usePresetControl({ current, lockedStates, push, setColorMeta, onNeedsConfirmation }: Params): UsePresetControlReturn {
  const activePresetId = useMemo(
    () => PALETTE_PRESETS.find(p => (current?.length ?? 0) > 0 && isPresetActive(current!, p))?.id ?? null,
    [current]
  )

  const applyPreset = useCallback((presetId: string) => {
    const preset = PALETTE_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    const newColors = generatePresetPalette(preset)
    const currentCount = (current ?? []).length
    push(newColors)
    const keepCount = getPresetColorIdKeepCount(currentCount, newColors.length)
    setColorMeta(prev => {
      const kept = prev.ids.slice(0, keepCount)
      while (kept.length < newColors.length) kept.push(crypto.randomUUID())
      return { locked: new Array(newColors.length).fill(false), ids: kept }
    })
  }, [current, push, setColorMeta])

  const handlePresetSelect = useCallback((presetId: string) => {
    if (shouldWarnBeforePreset(lockedStates)) {
      onNeedsConfirmation(presetId)
    } else {
      applyPreset(presetId)
    }
  }, [lockedStates, applyPreset, onNeedsConfirmation])

  // Reroll bypasses the warning — user is already in a preset, reroll is expected
  const rerollPreset = useCallback(() => {
    if (!activePresetId) return
    applyPreset(activePresetId)
  }, [activePresetId, applyPreset])

  const cyclePreset = useCallback(() => {
    const currentIndex = activePresetId
      ? PALETTE_PRESETS.findIndex(p => p.id === activePresetId)
      : -1
    const nextIndex = (currentIndex + 1) % PALETTE_PRESETS.length
    handlePresetSelect(PALETTE_PRESETS[nextIndex].id)
  }, [activePresetId, handlePresetSelect])

  return { activePresetId, applyPreset, handlePresetSelect, rerollPreset, cyclePreset }
}
