import { useCallback } from 'react'
import Header from './components/Header.tsx'
import Controls from './components/Controls.tsx'
import Hero from './components/Hero.tsx'
import { useHistory } from './hooks/useHistory'
import { getSavedPalettes, savePalette, removePalette } from './helpers/storage.ts'
import appStyles from './App.module.css'
import OpenDialog from './components/OpenDialog.tsx'
import SaveDialog from './components/SaveDialog.tsx'
import { useState } from 'react'

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
  } = useHistory<string>({ initialHistory: [], initialIndex: -1 })

  const generateRandomColor = useCallback((): string => {
    const value = Math.floor(Math.random() * 0xffffff)
    return `#${value.toString(16).padStart(6, '0')}`
  }, [])

  const handleHeroClick = useCallback(() => {
    const color = generateRandomColor()
    push(color)
  }, [generateRandomColor, push])

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
      <Hero color={current ?? null} onClick={handleHeroClick} />
      {isOpenDialog ? (
        <OpenDialog
          palettes={getSavedPalettes()}
          onCancel={() => setIsOpenDialog(false)}
          onSelect={(id) => {
            const p = getSavedPalettes().find((x) => x.id === id)
            if (p) {
              replace(p.colors, p.colors.length - 1)
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
            savePalette(history, name)
            setIsSaveDialog(false)
          }}
        />
      ) : null}
    </div>
  )
}

export default App
