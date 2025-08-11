import { useCallback } from 'react'
import Header from './components/Header.tsx'
import Controls from './components/Controls.tsx'
import AnimatedPaletteContainer from './components/AnimatedPaletteContainer.tsx'
import GlobalColorRelationshipSelector from './components/GlobalColorRelationshipSelector.tsx'
import { useHistory } from './hooks/useHistory'
import { getSavedPalettes, savePalette, removePalette } from './helpers/storage.ts'
import appStyles from './App.module.css'
import OpenDialog from './components/OpenDialog.tsx'
import SaveDialog from './components/SaveDialog.tsx'
import EditColorDialog from './components/EditColorDialog.tsx'
import { useState } from 'react'
import { generateRelatedColor, type ColorRelationship } from './helpers/colorTheory.ts'

function App() {
  const [isOpenDialog, setIsOpenDialog] = useState(false)
  const [isSaveDialog, setIsSaveDialog] = useState(false)
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

  const generateRandomColor = useCallback((): string => {
    const value = Math.floor(Math.random() * 0xffffff)
    return `#${value.toString(16).padStart(6, '0')}`
  }, [])

  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [globalRelationship, setGlobalRelationship] = useState<ColorRelationship>('random')
  const [lockedStates, setLockedStates] = useState<boolean[]>([])

  const addColor = useCallback(() => {
    const base = current ?? []
    if (base.length >= 5) return
    
    let nextColor: string
    if (globalRelationship === 'random') {
      nextColor = generateRandomColor()
    } else {
      // Use existing colors as reference for new color
      const lockedColors = base.filter((_, i) => lockedStates[i])
      nextColor = generateRelatedColor(lockedColors, globalRelationship, base[base.length - 1])
    }
    
    push([...base, nextColor])
    setLockedStates(prev => [...prev, false])
  }, [current, globalRelationship, lockedStates, generateRandomColor, push])

  const rerollAt = useCallback((index: number) => {
    const base = current ?? []
    if (!base[index] || lockedStates[index]) return
    
    // Get locked colors as reference
    const lockedColors = base.filter((_, i) => lockedStates[i])
    
    const next = [...base]
    next[index] = generateRelatedColor(lockedColors, globalRelationship, base[index])
    push(next)
  }, [current, globalRelationship, lockedStates, push])

  const rerollAll = useCallback(() => {
    const base = current ?? []
    if (base.length === 0) return
    
    // Get locked colors as reference
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
    // Auto-reroll all unlocked colors when relationship changes
    const base = current ?? []
    if (base.length > 0) {
      const lockedColors = base.filter((_, i) => lockedStates[i])
      const next = base.map((color, index) => 
        lockedStates[index] ? color : generateRelatedColor(lockedColors, relationship, color)
      )
      push(next)
    }
  }, [current, lockedStates, push])

  return (
    <div className={appStyles.container}>
      <div className={appStyles.stack}>
        <Header title="Color Palette" />
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
              // Lock all loaded colors by default
              setLockedStates(new Array(p.colors.length).fill(true))
            }
            setIsOpenDialog(false)
          }}
          onRemove={(id) => {
            removePalette(id)
          }}
          onPalettesUpdated={() => {
            // Force refresh of dialog to show new palettes
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
            // Save the latest palette array (or entire history if desired)
            const toSave = (current ?? [])
            savePalette(toSave, name)
            setIsSaveDialog(false)
          }}
        />
      ) : null}
    </div>
  )
}

export default App
