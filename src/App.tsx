import { useCallback, useState, useEffect, useRef } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import Header from '@/components/Header'
import Controls from '@/components/Controls'
import AnimatedPaletteContainer from '@/components/AnimatedPaletteContainer'
import ColorVariations from '@/components/ColorVariations'
import GlobalColorRelationshipSelector from '@/components/GlobalColorRelationshipSelector'
import ContrastChecker from '@/components/ContrastChecker'
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
import { getSavedPalettes, savePalette, removePalette } from '@/helpers/storage'
import { generateRelatedColor, generatePresetPalette, PALETTE_PRESETS, isPresetActive, MAX_COLORS, getRowSplit, shouldWarnBeforePreset, getPresetColorIdKeepCount, type ColorRelationship } from '@/helpers/colorTheory'
import { decodePaletteFromUrl, copyShareUrl, clearUrlParams } from '@/helpers/urlShare'
import { hasEyeDropper, pickColorNative } from '@/helpers/eyeDropper'
import { shouldScrollOnExpand, SCROLL_DELAY_MS } from '@/helpers/scroll'

function App() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
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
  const contrastRef = useRef<HTMLDivElement>(null)
  const cycleContrastTabRef = useRef<(() => void) | null>(null)
  const cycleCVDRef = useRef<(() => void) | null>(null)
  const colorInputRef = useRef<HTMLInputElement>(null)
  const {
    history,
    current,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    replace,
  } = useHistory<string[]>({ initialHistory: [], initialIndex: -1 })
  const { cycleTheme } = useTheme()
  const [urlLoaded, setUrlLoaded] = useState(false)

  const generateRandomColor = useCallback((): string => {
    const value = Math.floor(Math.random() * 0xffffff)
    return `#${value.toString(16).padStart(6, '0')}`
  }, [])

  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [globalRelationship, setGlobalRelationship] = useState<ColorRelationship>('random')
  const [lockedStates, setLockedStates] = useState<boolean[]>([])
  const [colorIds, setColorIds] = useState<string[]>([])
  const [variationsIndex, setVariationsIndex] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState(false)
  const [swapSelection, setSwapSelection] = useState<number | null>(null)

  // Load palette from URL on mount
  useEffect(() => {
    if (urlLoaded) return
    
    const shared = decodePaletteFromUrl()
    if (shared && shared.colors.length > 0) {
      replace([shared.colors], 0)
      setLockedStates(shared.lockedStates)
      setColorIds(shared.colors.map(() => crypto.randomUUID()))
      clearUrlParams()
    }
    setUrlLoaded(true)
  }, [urlLoaded, replace])

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

    let nextColor: string
    if (globalRelationship === 'random') {
      nextColor = generateRandomColor()
    } else {
      const lockedColors = base.filter((_, i) => lockedStates[i])
      nextColor = generateRelatedColor(lockedColors, globalRelationship, base[base.length - 1])
    }

    push([...base, nextColor])
    setLockedStates(prev => [...prev, false])
    setColorIds(prev => [...prev, crypto.randomUUID()])
  }, [current, globalRelationship, lockedStates, generateRandomColor, push])

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
    setLockedStates(prev => prev.filter((_, i) => i !== index))
    setColorIds(prev => {
      const filtered = prev.filter((_, i) => i !== index)
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
        return filtered.map((id, i) => (i >= crossStart && i < crossEnd ? crypto.randomUUID() : id))
      }
      return filtered
    })
  }, [current, push])

  const toggleLockAt = useCallback((index: number) => {
    setLockedStates(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  const reorderColors = useCallback((fromIndex: number, toIndex: number) => {
    const base = current ?? []
    if (fromIndex === toIndex) return
    const newColors = [...base]
    const [moved] = newColors.splice(fromIndex, 1)
    newColors.splice(toIndex, 0, moved)
    push(newColors)
    setLockedStates(prev => {
      const next = [...prev]
      const [movedLock] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, movedLock)
      return next
    })
    setColorIds(prev => {
      const next = [...prev]
      const [movedId] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, movedId)
      return next
    })
  }, [current, push])

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
    setLockedStates(prev => [...prev, false])
    setColorIds(prev => [...prev, crypto.randomUUID()])
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

  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const applyPreset = useCallback((presetId: string) => {
    const preset = PALETTE_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    const newColors = generatePresetPalette(preset)
    const currentCount = (current ?? []).length

    push(newColors)
    setLockedStates(new Array(newColors.length).fill(false))
    setActivePresetId(presetId)

    const keepCount = getPresetColorIdKeepCount(currentCount, newColors.length)
    setColorIds(prev => {
      const kept = prev.slice(0, keepCount)
      while (kept.length < newColors.length) kept.push(crypto.randomUUID())
      return kept
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

  // Drift detection: clear active preset if colors leave its HSL bounds
  useEffect(() => {
    if (!activePresetId || !current?.length) return
    const preset = PALETTE_PRESETS.find(p => p.id === activePresetId)
    if (!preset || !isPresetActive(current, preset)) {
      setActivePresetId(null)
    }
  }, [current, activePresetId])

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
    const modes: ColorRelationship[] = [
      'random', 'complementary', 'analogous', 'triadic',
      'tetradic', 'split-complementary', 'monochromatic',
    ]
    setGlobalRelationship(prev => {
      const idx = modes.indexOf(prev)
      return modes[(idx + 1) % modes.length]
    })
  }, [])

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
    onEditColor: setEditIndex,
    onCycleCVD: () => cycleCVDRef.current?.(),
    onCycleRelationship: cycleRelationship,
    onPickColor: handlePickColor,
    onCyclePreset: cyclePreset,
    onPresetReroll: rerollPreset,
    onViewVariations: setVariationsIndex,
    onToggleDocs: toggleDocs,
    onToggleSwapMode: toggleSwapMode,
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
                onEditStart={setEditIndex}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditIndex(null)}
                onReroll={rerollAt}
                onDelete={deleteAt}
                onToggleLock={toggleLockAt}
                onViewVariations={setVariationsIndex}
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
        </LayoutGroup>

        {isOpenDialog ? (
          <OpenDialog
            palettes={getSavedPalettes()}
            onCancel={() => setIsOpenDialog(false)}
            onSelect={(id) => {
              const p = getSavedPalettes().find((x) => x.id === id)
              if (p) {
                replace([p.colors], p.colors.length - 1)
                setLockedStates(new Array(p.colors.length).fill(true))
                setColorIds(p.colors.map(() => crypto.randomUUID()))
              }
              setIsOpenDialog(false)
            }}
            onRemove={(id) => {
              removePalette(id)
            }}
            onPalettesUpdated={() => {
              setIsOpenDialog(false)
              setTimeout(() => setIsOpenDialog(true), 100)
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
