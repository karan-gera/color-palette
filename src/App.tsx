import { useCallback } from 'react'
import Header from './components/Header.tsx'
import Controls from './components/Controls.tsx'
import AddColor from './components/AddColor.tsx'
import AnimatedPaletteItem from './components/AnimatedPaletteItem.tsx'
import { useHistory } from './hooks/useHistory'
import { getSavedPalettes, savePalette, removePalette } from './helpers/storage.ts'
import appStyles from './App.module.css'
import OpenDialog from './components/OpenDialog.tsx'
import SaveDialog from './components/SaveDialog.tsx'
import EditColorDialog from './components/EditColorDialog.tsx'
import { useState } from 'react'
import paletteStyles from './components/Palette.module.css'

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

  const addColor = useCallback(() => {
    const nextColor = generateRandomColor()
    const base = current ?? []
    if (base.length >= 5) return
    push([...base, nextColor])
  }, [current, generateRandomColor, push])

  const rerollAt = useCallback((index: number) => {
    const base = current ?? []
    if (!base[index]) return
    const next = [...base]
    next[index] = generateRandomColor()
    push(next)
  }, [current, generateRandomColor, push])

  const deleteAt = useCallback((index: number) => {
    const base = current ?? []
    const next = base.filter((_, i) => i !== index)
    push(next)
  }, [current, push])

  const [editIndex, setEditIndex] = useState<number | null>(null)

  const handleOpen = useCallback(() => {
    setIsOpenDialog(true)
  }, [])

  const handleSave = useCallback(() => {
    setIsSaveDialog(true)
  }, [])

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
      <div className={paletteStyles.row}>
        {(current ?? []).map((c, i) => (
          <AnimatedPaletteItem
            key={`${i}-${c}`}
            color={c}
            index={i}
            onEdit={() => setEditIndex(i)}
            onReroll={() => rerollAt(i)}
            onDelete={() => deleteAt(i)}
          />
        ))}
        {(current ?? []).length < 5 ? <AddColor onAdd={addColor} /> : null}
      </div>
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
            }
            setIsOpenDialog(false)
          }}
          onRemove={(id) => {
            removePalette(id)
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
