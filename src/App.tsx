import { useCallback, useEffect, useRef } from 'react'
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
import { useColorEditing } from '@/hooks/useColorEditing'
import { useSwapMode } from '@/hooks/useSwapMode'
import { usePresetControl } from '@/hooks/usePresetControl'
import { useViewNavigation } from '@/hooks/useViewNavigation'
import { useDialogState } from '@/hooks/useDialogState'
import { savePalette, removePalette, getSavedPalettes } from '@/helpers/storage'
import { MAX_COLORS, getPresetColorIdKeepCount } from '@/helpers/colorTheory'
import { copyShareUrl } from '@/helpers/urlShare'
import { hasEyeDropper, pickColorNative } from '@/helpers/eyeDropper'

function App() {
  const {
    isOpenDialog, setIsOpenDialog,
    savedPalettes, setSavedPalettes,
    isSaveDialog, setIsSaveDialog,
    isExportDialog, setIsExportDialog,
    exportInitialView, setExportInitialView,
    isGradientExportDialog, setIsGradientExportDialog,
    pendingPreset, setPendingPreset,
    pendingExtractColors, setPendingExtractColors,
    handleOpen, handleSave, handleImageExport,
    isAnyOpen: isAnyDialogStateOpen,
    closeAll: closeDialogs,
  } = useDialogState()
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
    swapColors,
    handleRelationshipChange,
    cycleRelationship,
    addPickedColor,
  } = usePaletteColors()
  const { cycleTheme } = useTheme()

  const {
    editIndex,
    variationsIndex,
    setEditIndex,
    setVariationsIndex,
    openEdit,
    openVariations,
    handleEditSave,
    replaceColorFromVariation,
    isAnyOpen: isColorEditingOpen,
    closeAll: closeColorEditing,
  } = useColorEditing({ current, push })
  const {
    swapMode,
    swapSelection,
    toggleSwapMode,
    handleSwapClick,
    close: closeSwapMode,
  } = useSwapMode({ swapColors, setEditIndex })
  const gradientState = useGradientStops(current ?? [], colorIds)
  const {
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
  } = useViewNavigation({ current, colorIds, gradientState, setNotification })

  // Always keep palette-linked stops in sync with the current palette colors
  useEffect(() => {
    const palette = (current ?? []).map((hex, i) => ({ id: colorIds[i], hex }))
    gradientState.syncPaletteColors(palette)
  }, [current, colorIds]) // gradientState.syncPaletteColors is stable

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
    if (activeView === 'gradient') {
      setIsGradientExportDialog(true)
    } else {
      setExportInitialView('selecting')
      setIsExportDialog(true)
    }
  }, [activeView])

  const handlePickColor = useCallback(async () => {
    if ((current ?? []).length >= MAX_COLORS) return
    if (hasEyeDropper) {
      const hex = await pickColorNative()
      if (hex) addPickedColor(hex)
    } else {
      colorInputRef.current?.click()
    }
  }, [current, addPickedColor])

  const {
    activePresetId,
    applyPreset,
    handlePresetSelect,
    rerollPreset,
    cyclePreset,
  } = usePresetControl({ current, lockedStates, push, setColorMeta, onNeedsConfirmation: setPendingPreset })

  const closeAllDialogs = useCallback(() => {
    closeDialogs()
    closeColorEditing()
    closeDocs()
    setShowHistory(false)
    closePreviews()
    closeSwapMode()
  }, [closeDialogs, closeColorEditing, closeDocs, setShowHistory, closePreviews, closeSwapMode])

  // Keep this list in sync with closeAllDialogs above.
  // showHistory is intentionally excluded — shortcuts still work while the history panel is open.
  const isAnyDialogOpen =
    isAnyDialogStateOpen ||
    isColorEditingOpen ||
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

        {/* Spacer to clear fixed keyboard hints overlay — taller when panel is open */}
        <div className={`transition-all duration-300 ${showHints ? 'h-[340px]' : 'h-52'}`} aria-hidden="true" />
      </div>

      {/* Bottom fade so content doesn't clash with fixed keyboard hints */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background pointer-events-none z-40 transition-all duration-300 ${showHints ? 'h-[340px]' : 'h-56'}`}
        style={{ maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }}
        aria-hidden="true"
      />

      {/* Fixed elements outside cvd-wrapper to avoid Firefox filter bug */}
      <KeyboardHints visible={showHints} onToggle={toggleHints} colorCount={(current ?? []).length} />
      <DocsOverlay visible={showDocs} onClose={closeDocs} />
      <AnimatePresence>
        {showPreviewOverlay && (
          <PalettePreviewOverlay
            key={(current ?? []).join(',')}
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
