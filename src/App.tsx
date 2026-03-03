import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import { type CVDToggleHandle } from '@/components/CVDToggle'
import Controls from '@/components/Controls'
import AnimatedPaletteContainer from '@/components/AnimatedPaletteContainer'
import ColorVariations from '@/components/ColorVariations'
import GlobalColorRelationshipSelector from '@/components/GlobalColorRelationshipSelector'
import ContrastChecker, { type ContrastCheckerHandle } from '@/components/ContrastChecker'
import HarmonyScore from '@/components/HarmonyScore'
import PaletteHistory from '@/components/PaletteHistory'
import OpenDialog from '@/components/OpenDialog'
import SaveDialog from '@/components/SaveDialog'
import ExportDialog from '@/components/ExportDialog'
import GradientView from '@/components/GradientView'
import GradientExportDialog from '@/components/GradientExportDialog'
import ExtractView from '@/components/ExtractView'
import ConfirmDialog from '@/components/ConfirmDialog'
import PalettePreviewOverlay from '@/components/PalettePreviewOverlay'
import GradientPreviewOverlay from '@/components/GradientPreviewOverlay'
import ViewTabStrip from '@/components/ViewTabStrip'
import KeyboardHints from '@/components/KeyboardHints'
import DocsOverlay from '@/components/DocsOverlay'
import CVDFilters from '@/components/CVDFilters'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useGradientStops } from '@/hooks/useGradientStops'
import { useUIPanels } from '@/hooks/useUIPanels'
import { usePaletteColors } from '@/hooks/usePaletteColors'
import { getSavedPalettes, savePalette, removePalette, type SavedPalette } from '@/helpers/storage'
import { generatePresetPalette, PALETTE_PRESETS, isPresetActive, MAX_COLORS, shouldWarnBeforePreset, getPresetColorIdKeepCount } from '@/helpers/colorTheory'
import { copyShareUrl } from '@/helpers/urlShare'
import { hasEyeDropper, pickColorNative } from '@/helpers/eyeDropper'

function App() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([])
  const [isSaveDialog, setIsSaveDialog] = useState(false)
  const [isExportDialog, setIsExportDialog] = useState(false)
  const [exportInitialView, setExportInitialView] = useState<'selecting' | 'image'>('selecting')
  const [pendingPreset, setPendingPreset] = useState<string | null>(null)
  const [pendingExtractColors, setPendingExtractColors] = useState<string[] | null>(null)
  const {
    showHints, showContrast, showDocs, showHistory, showHarmony,
    notification, setNotification, setShowHistory, setShowHarmony,
    toggleHints, toggleContrast, toggleDocs, closeDocs,
  } = useUIPanels()
  const contrastRef = useRef<HTMLDivElement>(null)
  const cycleContrastTabRef = useRef<ContrastCheckerHandle>(null)
  const cycleCVDRef = useRef<CVDToggleHandle>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const {
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
  } = usePaletteColors()
  const { cycleTheme } = useTheme()

  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [variationsIndex, setVariationsIndex] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSelection, setSwapSelection] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<'palette' | 'gradient' | 'extract'>('palette')
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false)
  const [showGradientPreviewOverlay, setShowGradientPreviewOverlay] = useState(false)
  const [isGradientExportDialog, setIsGradientExportDialog] = useState(false)
  const [gradientPreviewRatio, setGradientPreviewRatio] = useState(() => {
    const stored = localStorage.getItem('color-palette:gradient-ratio')
    return stored ? parseFloat(stored) : 16 / 9
  })
  const gradientState = useGradientStops(current ?? [], colorIds)

  // Persist gradient preview ratio
  useEffect(() => {
    localStorage.setItem('color-palette:gradient-ratio', String(gradientPreviewRatio))
  }, [gradientPreviewRatio])

  // Always keep palette-linked stops in sync with the current palette colors
  useEffect(() => {
    const palette = (current ?? []).map((hex, i) => ({ id: colorIds[i], hex }))
    gradientState.syncPaletteColors(palette)
  }, [current, colorIds]) // gradientState.syncPaletteColors is stable

  // Load saved palettes when dialog opens
  useEffect(() => {
    if (isOpenDialog) setSavedPalettes(getSavedPalettes())
  }, [isOpenDialog])

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

  const handleSwitchView = useCallback((view: 'palette' | 'gradient' | 'extract') => {
    if (view === 'gradient' && gradientState.stops.length < 2) {
      if ((current ?? []).length === 0) {
        setNotification('add colors to the palette first')
        return
      }
      gradientState.resetToPalette(current ?? [], colorIds)
    }
    setActiveView(view)
  }, [current, colorIds, gradientState])

  // Cycle through all tab-strip views in order
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
    // extract view: no preview yet
  }, [activeView])

  const handleToggleExtract = useCallback(() => {
    handleSwitchView(activeView === 'extract' ? 'palette' : 'extract')
  }, [activeView, handleSwitchView])

  const handleRedrawGradient = useCallback(() => {
    gradientState.resetToPalette(current ?? [], colorIds)
  }, [current, colorIds, gradientState])

  const handleExport = useCallback(() => {
    if (activeView === 'gradient') {
      setIsGradientExportDialog(true)
    } else {
      setExportInitialView('selecting')
      setIsExportDialog(true)
    }
  }, [activeView])

  const handleImageExport = useCallback(() => {
    setExportInitialView('image')
    setIsExportDialog(true)
  }, [])

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
    setIsGradientExportDialog(false)
    setPendingPreset(null)
    setPendingExtractColors(null)
    setEditIndex(null)
    setVariationsIndex(null)
    closeDocs()
    setShowHistory(false)
    setShowPreviewOverlay(false)
    setShowGradientPreviewOverlay(false)
    setSwapMode(false)
    setSwapSelection(null)
  }, [])

  // Keep this list in sync with closeAllDialogs above.
  // showHistory is intentionally excluded — shortcuts still work while the history panel is open.
  const isAnyDialogOpen =
    isOpenDialog ||
    isSaveDialog ||
    isExportDialog ||
    isGradientExportDialog ||
    pendingPreset !== null ||
    pendingExtractColors !== null ||
    editIndex !== null ||
    variationsIndex !== null ||
    showDocs ||
    showPreviewOverlay ||
    showGradientPreviewOverlay ||
    swapMode

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
    onCycleContrastTab: () => cycleContrastTabRef.current?.cycleTab(),
    onDeleteColor: deleteAt,
    onRerollColor: rerollAt,
    onEditColor: openEdit,
    onCycleCVD: () => cycleCVDRef.current?.cycle(),
    onCycleRelationship: cycleRelationship,
    onPickColor: handlePickColor,
    onCyclePreset: cyclePreset,
    onPresetReroll: rerollPreset,
    onViewVariations: openVariations,
    onToggleDocs: toggleDocs,
    onToggleSwapMode: toggleSwapMode,
    onToggleHistory: () => setShowHistory(v => !v),
    onToggleHarmony: () => setShowHarmony(v => !v),
    onToggleView: handleToggleView,
    onTogglePreview: handleTogglePreview,
    onToggleExtract: handleToggleExtract,
    onEscape: closeAllDialogs,
    colorCount: (current ?? []).length,
    isDialogOpen: isAnyDialogOpen,
    isPaletteView: activeView === 'palette',
  })

  return (
    <>
      {/* SVG filters for Firefox/Waterfox compatibility - must be in same document */}
      <CVDFilters />
      
      {/* Wrapper for CVD filter application (Firefox workaround) */}
      <div id="cvd-wrapper" className="min-h-screen p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
          <Header title="color palette" cvdRef={cycleCVDRef} onToggleDocs={toggleDocs} />
          <AnimatePresence initial={false}>
            {activeView === 'palette' && (
              <motion.div
                key="controls"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: { duration: 0.2 } }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.12 } }}
                className="w-full flex justify-center"
                style={{ overflow: 'hidden' }}
              >
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
                  onPreview={() => setShowPreviewOverlay(v => !v)}
                  canPreview={(current ?? []).length > 0}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace: palette view or gradient view, with tab strip on the right */}
        <div className="relative w-full flex justify-center">
          {/* Vertical tab strip — fixed to right side of viewport */}
          <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30">
            <ViewTabStrip activeView={activeView} onSwitch={handleSwitchView} />
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'palette' ? (
              <motion.div
                key="palette-view"
                className="w-full flex flex-col items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
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
                    className="w-full"
                  >
                    <HarmonyScore
                      colors={current ?? []}
                      expanded={showHarmony}
                      onToggle={() => setShowHarmony(v => !v)}
                    />
                  </motion.div>

                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    ref={contrastRef}
                  >
                    <ContrastChecker ref={cycleContrastTabRef} colors={current ?? []} expanded={showContrast} onToggle={toggleContrast} />
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
              </motion.div>
            ) : activeView === 'gradient' ? (
              <motion.div
                key="gradient-view"
                className="w-full max-w-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <GradientView
                  palette={current ?? []}
                  colorIds={colorIds}
                  gradientState={gradientState}
                  onOpenExport={() => setIsGradientExportDialog(true)}
                  onRedrawGradient={handleRedrawGradient}
                  previewRatio={gradientPreviewRatio}
                  onPreviewRatioChange={setGradientPreviewRatio}
                />
              </motion.div>
            ) : (
              <motion.div
                key="extract-view"
                className="w-full max-w-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ExtractView
                  onAddColors={(colors) => {
                    if (lockedStates.some(Boolean)) {
                      setPendingExtractColors(colors)
                    } else {
                      const next = colors.slice(0, MAX_COLORS)
                      push(next)
                      setColorMeta({ locked: next.map(() => false), ids: next.map(() => crypto.randomUUID()) })
                      handleSwitchView('palette')
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

        {isGradientExportDialog ? (
          <GradientExportDialog
            config={{ type: 'linear', angle: gradientState.angle, stops: gradientState.stops }}
            aspectRatio={gradientPreviewRatio}
            onCancel={() => setIsGradientExportDialog(false)}
            onCopied={setNotification}
          />
        ) : null}

        <ConfirmDialog
          open={pendingExtractColors !== null}
          message="this will replace your palette, including locked colors. continue?"
          confirmLabel="replace"
          onConfirm={() => {
            const next = pendingExtractColors!.slice(0, MAX_COLORS)
            push(next)
            setColorMeta({ locked: next.map(() => false), ids: next.map(() => crypto.randomUUID()) })
            setPendingExtractColors(null)
            handleSwitchView('palette')
          }}
          onCancel={() => setPendingExtractColors(null)}
        />

        <ConfirmDialog
          open={pendingPreset !== null}
          message="this will replace your current palette. continue?"
          confirmLabel="continue"
          onConfirm={() => {
            applyPreset(pendingPreset!)
            setPendingPreset(null)
          }}
          onCancel={() => setPendingPreset(null)}
        />

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
      <DocsOverlay visible={showDocs} onClose={closeDocs} />
      <AnimatePresence>
        {showPreviewOverlay && (
          <PalettePreviewOverlay
            palette={current ?? []}
            onClose={() => setShowPreviewOverlay(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGradientPreviewOverlay && (
          <GradientPreviewOverlay
            onClose={() => setShowGradientPreviewOverlay(false)}
          />
        )}
      </AnimatePresence>

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
