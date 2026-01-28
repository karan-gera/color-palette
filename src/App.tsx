import { useCallback, useState } from 'react'
import Header from '@/components/Header'
import Controls from '@/components/Controls'
import AnimatedPaletteContainer from '@/components/AnimatedPaletteContainer'
import GlobalColorRelationshipSelector from '@/components/GlobalColorRelationshipSelector'
import OpenDialog from '@/components/OpenDialog'
import SaveDialog from '@/components/SaveDialog'
import EditColorDialog from '@/components/EditColorDialog'
import KeyboardHints from '@/components/KeyboardHints'
import { useHistory } from '@/hooks/useHistory'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { getSavedPalettes, savePalette, removePalette } from '@/helpers/storage'
import { generateRelatedColor, type ColorRelationship } from '@/helpers/colorTheory'

function App() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [isSaveDialog, setIsSaveDialog] = useState(false)
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

  const generateRandomColor = useCallback((): string => {
    const value = Math.floor(Math.random() * 0xffffff)
    return `#${value.toString(16).padStart(6, '0')}`
  }, [])

  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [globalRelationship, setGlobalRelationship] = useState<ColorRelationship>('random')
  const [lockedStates, setLockedStates] = useState<boolean[]>([])

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
    setEditIndex(null)
  }, [])

  const isAnyDialogOpen = isOpenDialog || isSaveDialog || editIndex !== null

  useKeyboardShortcuts({
    onAddColor: addColor,
    onUndo: undo,
    onRedo: redo,
    onOpen: handleOpen,
    onSave: handleSave,
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
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
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

      <KeyboardHints visible={showHints} onToggle={toggleHints} />
    </div>
  )
}

export default App
