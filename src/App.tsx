import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import Header from '@/components/Header'
import Controls from '@/components/Controls'
import AnimatedPaletteContainer from '@/components/AnimatedPaletteContainer'
import ColorVariations from '@/components/ColorVariations'
import GlobalColorRelationshipSelector from '@/components/GlobalColorRelationshipSelector'
import ContrastChecker from '@/components/ContrastChecker'
import PaletteHistory from '@/components/PaletteHistory'
import OpenDialog from '@/components/OpenDialog'
import SaveDialog from '@/components/SaveDialog'
import ExportDialog from '@/components/ExportDialog'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import KeyboardHints from '@/components/KeyboardHints'
import DocsOverlay from '@/components/DocsOverlay'
import CVDFilters from '@/components/CVDFilters'
import { useHistory } from '@/hooks/useHistory'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getSavedPalettes, savePalette, removePalette, loadPersistedHistory, persistHistory, type SavedPalette } from '@/helpers/storage'
import { generateRelatedColor, generatePresetPalette, PALETTE_PRESETS, isPresetActive, MAX_COLORS, getRowSplit, shouldWarnBeforePreset, getPresetColorIdKeepCount, type ColorRelationship } from '@/helpers/colorTheory'
import { decodePaletteFromUrl, copyShareUrl, clearUrlParams } from '@/helpers/urlShare'
import { hasEyeDropper, pickColorNative } from '@/helpers/eyeDropper'
import { shouldScrollOnExpand, SCROLL_DELAY_MS } from '@/helpers/scroll'

const RELATIONSHIP_MODES: ColorRelationship[] = [
  'random', 'complementary', 'analogous', 'triadic',
  'tetradic', 'split-complementary', 'monochromatic',
]

function App() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([])
  const [isSaveDialog, setIsSaveDialog] = useState(false)
  const [isExportDialog, setIsExportDialog] = useState(false)
  const [exportInitialView, setExportInitialView] = useState<'selecting' | 'image'>('selecting')
  const [pendingPreset, setPendingPreset] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(() => {
    const stored = localStorage.getItem('color-palette:show-hints')
    return stored !== 'false'
  })
  const [showContrast, setShowContrast] = useState(() => {
    const stored = localStorage.getItem('color-palette:show-contrast')
    return stored === 'true'
  })
  const [showDocs, setShowDocs] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const contrastRef = useRef<HTMLDivElement>(null)
  const cycleContrastTabRef = useRef<(() => void) | null>(null)
  const cycleCVDRef = useRef<(() => void) | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
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
  const { cycleTheme } = useTheme()
  const [urlLoaded, setUrlLoaded] = useState(false)

  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [globalRelationship, setGlobalRelationship] = useState<ColorRelationship>('random')
  const [colorMeta, setColorMeta] = useState<{ locked: boolean[]; ids: string[] }>(() => {
    const currentPalette = persistedHistory.index >= 0
      ? (persistedHistory.history[persistedHistory.index] ?? [])
      : []
    return {
      locked: currentPalette.map(() => false),
      ids: currentPalette.map(() => crypto.randomUUID()),
    }
  })
  const { locked: lockedStates, ids: colorIds } = colorMeta
  const [variationsIndex, setVariationsIndex] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSelection, setSwapSelection] = useState<number | null>(null)

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

  // Load saved palettes when dialog opens
  useEffect(() => {
    if (isOpenDialog) setSavedPalettes(getSavedPalettes())
  }, [isOpenDialog])

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const toggleHints = useCallback(() => {
    setShowHints(prev => {
      const next = !prev
      localStorage.setItem('color-palette:show-hints', String(next))
      return next
    })
  }, [])

  const toggleDocs = useCallback(() => {
    setShowDocs(prev => !prev)
  }, [])

  const toggleContrast = useCallback(() => {
    setShowContrast(prev => {
      const next = !prev
      localStorage.setItem('color-palette:show-contrast', String(next))
      if (shouldScrollOnExpand(next)) {
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        }, SCROLL_DELAY_MS)
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return next
    })
  }, [])

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

  const openEdit = useCallback((i: number) => {
    setVariationsIndex(null)
    setEditIndex(i)
  }, [])

  const openVariations = useCallback((i: number) => {
    setEditIndex(null)
    setVariationsIndex(i)
  }, [])

  const toggleSwapMode = useCallback(() => {
    setSwapMode(prev => {
      if (!prev) {
        setEditIndex(null)
      }
      setSwapSelection(null)
      return !prev
    })
  }, [])

  const handleSwapClick = useCallback((index: number) => {
    if (swapSelection === null) {
      setSwapSelection(index)
    } else if (swapSelection === index) {
      setSwapSelection(null)
    } else {
      reorderColors(swapSelection, index)
      setSwapSelection(null)
    }
  }, [swapSelection, reorderColors])

  const handleOpen = useCallback(() => {
    setIsOpenDialog(true)
  }, [])

  const handleSave = useCallback(() => {
    setIsSaveDialog(true)
  }, [])

  const handleShare = useCallback(async () => {
    const colors = current ?? []
    if (colors.length === 0) return
    
    const success = await copyShareUrl(colors, lockedStates)
    if (success) {
      setNotification('Link copied to clipboard!')
    } else {
      setNotification('Failed to copy link')
    }
  }, [current, lockedStates])

  const handleExport = useCallback(() => {
    setExportInitialView('selecting')
    setIsExportDialog(true)
  }, [])

  const handleImageExport = useCallback(() => {
    setExportInitialView('image')
    setIsExportDialog(true)
  }, [])

  const addPickedColor = useCallback((hex: string) => {
    const base = current ?? []
    if (base.length >= MAX_COLORS) return
    push([...base, hex])
    setColorMeta(prev => ({ locked: [...prev.locked, false], ids: [...prev.ids, crypto.randomUUID()] }))
  }, [current, push])

  const handlePickColor = useCallback(async () => {
    if ((current ?? []).length >= MAX_COLORS) return
    if (hasEyeDropper) {
      const hex = await pickColorNative()
      if (hex) addPickedColor(hex)
    } else {
      colorInputRef.current?.click()
    }
  }, [current, addPickedColor])

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
  }, [current, push])

  const handlePresetSelect = useCallback((presetId: string) => {
    if (shouldWarnBeforePreset(current ?? [])) {
      setPendingPreset(presetId)
    } else {
      applyPreset(presetId)
    }
  }, [current, applyPreset])

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

  const handleEditSave = useCallback((index: number, newHex: string) => {
    const base = current ?? []
    const next = [...base]
    next[index] = newHex
    push(next)
    setEditIndex(null)
  }, [current, push])

  const replaceColorFromVariation = useCallback((index: number, newHex: string) => {
    const next = [...(current ?? [])]
    next[index] = newHex
    push(next)
    setVariationsIndex(null)
  }, [current, push])

  const closeAllDialogs = useCallback(() => {
    setIsOpenDialog(false)
    setIsSaveDialog(false)
    setIsExportDialog(false)
    setPendingPreset(null)
    setEditIndex(null)
    setVariationsIndex(null)
    setShowDocs(false)
    setShowHistory(false)
    setSwapMode(false)
    setSwapSelection(null)
  }, [])

  const isAnyDialogOpen = isOpenDialog || isSaveDialog || isExportDialog || pendingPreset !== null || editIndex !== null || variationsIndex !== null || showDocs || swapMode

  useKeyboardShortcuts({
    onAddColor: addColor,
    onUndo: undo,
    onRedo: redo,
    onOpen: handleOpen,
    onSave: handleSave,
    onShare: handleShare,
    onExport: handleExport,
    onImageExport: handleImageExport,
    onRerollAll: rerollAll,
    onToggleLock: toggleLockAt,
    onCycleTheme: cycleTheme,
    onToggleHints: toggleHints,
    onToggleContrast: toggleContrast,
    onCycleContrastTab: () => cycleContrastTabRef.current?.(),
    onDeleteColor: deleteAt,
    onRerollColor: rerollAt,
    onEditColor: openEdit,
    onCycleCVD: () => cycleCVDRef.current?.(),
    onCycleRelationship: cycleRelationship,
    onPickColor: handlePickColor,
    onCyclePreset: cyclePreset,
    onPresetReroll: rerollPreset,
    onViewVariations: openVariations,
    onToggleDocs: toggleDocs,
    onToggleSwapMode: toggleSwapMode,
    onToggleHistory: () => setShowHistory(v => !v),
    onEscape: closeAllDialogs,
    colorCount: (current ?? []).length,
    isDialogOpen: isAnyDialogOpen,
  })

  return (
    <>
      {/* SVG filters for Firefox/Waterfox compatibility - must be in same document */}
      <CVDFilters />
      
      {/* Wrapper for CVD filter application (Firefox workaround) */}
      <div id="cvd-wrapper" className="min-h-screen p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
          <Header title="color palette" onCycleCVD={cycleCVDRef} onToggleDocs={toggleDocs} />
          <Controls
            onOpen={handleOpen}
            onSave={handleSave}
            onShare={handleShare}
            onExport={handleExport}
            onPresetSelect={handlePresetSelect}
            onPresetReroll={rerollPreset}
            activePresetId={activePresetId}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            canShare={(current ?? []).length > 0}
            canExport={(current ?? []).length > 0}
            onPickColor={handlePickColor}
            canPickColor={(current ?? []).length < MAX_COLORS}
            onToggleSwapMode={toggleSwapMode}
            swapMode={swapMode}
            canSwap={(current ?? []).length >= 2}
          />
        </div>

        <LayoutGroup>
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full flex justify-center"
          >
            <div className={`transition-all duration-300 ease-out ${
              variationsIndex !== null
                ? 'opacity-0 scale-[0.98] pointer-events-none absolute'
                : 'opacity-100 scale-100'
            }`}>
              <AnimatedPaletteContainer
                colors={current ?? []}
                colorIds={colorIds}
                lockedStates={lockedStates}
                editIndex={variationsIndex !== null ? null : editIndex}
                onEditStart={openEdit}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditIndex(null)}
                onReroll={rerollAt}
                onDelete={deleteAt}
                onToggleLock={toggleLockAt}
                onViewVariations={openVariations}
                onAdd={addColor}
                swapMode={swapMode}
                swapSelection={swapSelection}
                onSwapClick={handleSwapClick}
              />
            </div>
            <div className={`transition-all duration-300 ease-out ${
              variationsIndex !== null
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-[0.98] pointer-events-none absolute'
            }`}>
              {variationsIndex !== null && (current ?? [])[variationsIndex] && (
                <ColorVariations
                  sourceColor={(current ?? [])[variationsIndex]!}
                  sourceIndex={variationsIndex}
                  onClose={() => setVariationsIndex(null)}
                  onCopyHex={(hex) => {
                    navigator.clipboard.writeText(hex)
                    setNotification(`copied ${hex}`)
                  }}
                  onReplaceColor={replaceColorFromVariation}
                />
              )}
            </div>
          </motion.div>

          <GlobalColorRelationshipSelector
            currentRelationship={globalRelationship}
            onRelationshipChange={handleRelationshipChange}
            onGlobalReroll={rerollAll}
          />

          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            ref={contrastRef}
          >
            <ContrastChecker colors={current ?? []} expanded={showContrast} onToggle={toggleContrast} onCycleTab={cycleContrastTabRef} />
          </motion.div>

          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-full max-w-4xl"
          >
            <PaletteHistory
              history={history}
              currentIndex={historyIndex}
              expanded={showHistory}
              onToggle={() => setShowHistory(v => !v)}
              onRestore={jumpTo}
            />
          </motion.div>
        </LayoutGroup>

        {isOpenDialog ? (
          <OpenDialog
            palettes={savedPalettes}
            onCancel={() => setIsOpenDialog(false)}
            onSelect={(id) => {
              const p = savedPalettes.find((x) => x.id === id)
              if (p) {
                const currentCount = (current ?? []).length
                replace([p.colors], 0)

                const keepCount = getPresetColorIdKeepCount(currentCount, p.colors.length)
                setColorMeta(prev => {
                  const kept = prev.ids.slice(0, keepCount)
                  while (kept.length < p.colors.length) kept.push(crypto.randomUUID())
                  return { locked: new Array(p.colors.length).fill(true), ids: kept }
                })
              }
              setIsOpenDialog(false)
            }}
            onRemove={(id) => {
              removePalette(id)
              setSavedPalettes(getSavedPalettes())
            }}
            onPalettesUpdated={() => {
              setSavedPalettes(getSavedPalettes())
            }}
          />
        ) : null}

        {isSaveDialog ? (
          <SaveDialog
            defaultName={`Palette ${new Date().toLocaleString()}`}
            onCancel={() => setIsSaveDialog(false)}
            onSave={(name) => {
              if (history.length === 0) {
                setIsSaveDialog(false)
                return
              }
              const toSave = (current ?? [])
              savePalette(toSave, name)
              setIsSaveDialog(false)
            }}
          />
        ) : null}

        {isExportDialog ? (
          <ExportDialog
            colors={current ?? []}
            onCancel={() => setIsExportDialog(false)}
            onCopied={setNotification}
            initialView={exportInitialView}
          />
        ) : null}

        {pendingPreset !== null && (
          <Dialog open onOpenChange={(open) => !open && setPendingPreset(null)}>
            <DialogContent className="sm:max-w-sm" showCloseButton={false}>
              <div className="text-center py-2">
                <p className="font-mono text-sm leading-relaxed">
                  this will replace your current palette. continue?
                </p>
              </div>
              <DialogFooter className="sm:justify-center gap-2">
                <Button variant="outline" onClick={() => setPendingPreset(null)} className="font-mono lowercase">
                  cancel
                </Button>
                <Button
                  onClick={() => {
                    applyPreset(pendingPreset)
                    setPendingPreset(null)
                  }}
                  className="font-mono lowercase"
                >
                  continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Spacer to clear fixed keyboard hints overlay */}
        <div className="h-52" aria-hidden="true" />
      </div>

      {/* Bottom fade so content doesn't clash with fixed keyboard hints */}
      <div
        className="fixed bottom-0 left-0 right-0 h-56 bg-background pointer-events-none z-40 transition-colors duration-300"
        style={{ maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }}
        aria-hidden="true"
      />

      {/* Fixed elements outside cvd-wrapper to avoid Firefox filter bug */}
      <KeyboardHints visible={showHints} onToggle={toggleHints} colorCount={(current ?? []).length} />
      <DocsOverlay visible={showDocs} onClose={() => setShowDocs(false)} />

      {/* Hidden color input fallback for non-Chromium browsers */}
      <input
        ref={colorInputRef}
        type="color"
        className="sr-only"
        onChange={(e) => addPickedColor(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Notification toast */}
      {notification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md font-mono text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          {notification}
        </div>
      )}
    </>
  )
}

export default App
