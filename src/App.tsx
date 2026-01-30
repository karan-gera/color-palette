import { useCallback, useState, useEffect } from 'react'
import Header from '@/components/Header'
import Controls from '@/components/Controls'
import AnimatedPaletteContainer from '@/components/AnimatedPaletteContainer'
import GlobalColorRelationshipSelector from '@/components/GlobalColorRelationshipSelector'
import OpenDialog from '@/components/OpenDialog'
import SaveDialog from '@/components/SaveDialog'
import ExportDialog from '@/components/ExportDialog'
import EditColorDialog from '@/components/EditColorDialog'
import KeyboardHints from '@/components/KeyboardHints'
import { useHistory } from '@/hooks/useHistory'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getSavedPalettes, savePalette, removePalette } from '@/helpers/storage'
import { generateRelatedColor, type ColorRelationship } from '@/helpers/colorTheory'
import { decodePaletteFromUrl, copyShareUrl, clearUrlParams } from '@/helpers/urlShare'

function App() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [isSaveDialog, setIsSaveDialog] = useState(false)
  const [isExportDialog, setIsExportDialog] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(() => {
    const stored = localStorage.getItem('color-palette:show-hints')
    return stored !== 'false' // Default to true
  })
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

  // Load palette from URL on mount
  useEffect(() => {
    if (urlLoaded) return
    
    const shared = decodePaletteFromUrl()
    if (shared && shared.colors.length > 0) {
      replace([shared.colors], 0)
      setLockedStates(shared.lockedStates)
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

  const addColor = useCallback(() => {
    const base = current ?? []
    if (base.length >= 5) return
    
    let nextColor: string
    if (globalRelationship === 'random') {
      nextColor = generateRandomColor()
    } else {
      const lockedColors = base.filter((_, i) => lockedStates[i])
      nextColor = generateRelatedColor(lockedColors, globalRelationship, base[base.length - 1])
    }
    
    push([...base, nextColor])
    setLockedStates(prev => [...prev, false])
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
  }, [current, push])

  const toggleLockAt = useCallback((index: number) => {
    setLockedStates(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

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
    setIsExportDialog(true)
  }, [])

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

  const closeAllDialogs = useCallback(() => {
    setIsOpenDialog(false)
    setIsSaveDialog(false)
    setIsExportDialog(false)
    setEditIndex(null)
  }, [])

  const isAnyDialogOpen = isOpenDialog || isSaveDialog || isExportDialog || editIndex !== null

  useKeyboardShortcuts({
    onAddColor: addColor,
    onUndo: undo,
    onRedo: redo,
    onOpen: handleOpen,
    onSave: handleSave,
    onShare: handleShare,
    onExport: handleExport,
    onRerollAll: rerollAll,
    onToggleLock: toggleLockAt,
    onCycleTheme: cycleTheme,
    onToggleHints: toggleHints,
    onEscape: closeAllDialogs,
    colorCount: (current ?? []).length,
    isDialogOpen: isAnyDialogOpen,
  })

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
        <Header title="color palette" />
        <Controls
          onOpen={handleOpen}
          onSave={handleSave}
          onShare={handleShare}
          onExport={handleExport}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          canShare={(current ?? []).length > 0}
          canExport={(current ?? []).length > 0}
        />
      </div>

      <AnimatedPaletteContainer
        colors={current ?? []}
        lockedStates={lockedStates}
        onEdit={setEditIndex}
        onReroll={rerollAt}
        onDelete={deleteAt}
        onToggleLock={toggleLockAt}
        onAdd={addColor}
      />

      <GlobalColorRelationshipSelector
        currentRelationship={globalRelationship}
        onRelationshipChange={handleRelationshipChange}
        onGlobalReroll={rerollAll}
      />

      {editIndex !== null && (current ?? [])[editIndex] ? (
        <EditColorDialog
          initial={(current ?? [])[editIndex]!}
          onCancel={() => setEditIndex(null)}
          onSave={(value) => {
            const base = current ?? []
            const next = [...base]
            next[editIndex!] = value
            push(next)
            setEditIndex(null)
          }}
        />
      ) : null}

      {isOpenDialog ? (
        <OpenDialog
          palettes={getSavedPalettes()}
          onCancel={() => setIsOpenDialog(false)}
          onSelect={(id) => {
            const p = getSavedPalettes().find((x) => x.id === id)
            if (p) {
              replace([p.colors], p.colors.length - 1)
              setLockedStates(new Array(p.colors.length).fill(true))
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
        />
      ) : null}

      <KeyboardHints visible={showHints} onToggle={toggleHints} />

      {/* Notification toast */}
      {notification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md font-mono text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          {notification}
        </div>
      )}
    </div>
  )
}

export default App
