import { useCallback } from 'react'
import Header from './components/Header.tsx'
import Controls from './components/Controls.tsx'
import Hero from './components/Hero.tsx'
import { useHistory } from './hooks/useHistory'
import { getSavedPalettes, savePalette, type SavedPalette } from './helpers/storage.ts'
import appStyles from './App.module.css'

function App() {
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
    const palettes: SavedPalette[] = getSavedPalettes()
    if (palettes.length === 0) {
      window.alert('No saved palettes found.')
      return
    }
    const list = palettes
      .map((p, idx) => `${idx}. ${p.name} (${p.colors.length} colors)`) 
      .join('\n')
    const input = window.prompt(`Enter the number of the palette to load:\n${list}`)
    if (input == null) return
    const indexToLoad = Number.parseInt(input, 10)
    if (Number.isNaN(indexToLoad) || indexToLoad < 0 || indexToLoad >= palettes.length) {
      window.alert('Invalid selection.')
      return
    }
    const selected = palettes[indexToLoad]
    replace(selected.colors, selected.colors.length - 1)
  }, [replace])

  const handleSave = useCallback(() => {
    if (history.length === 0) {
      window.alert('Nothing to save yet. Click the plus to generate colors.')
      return
    }
    const name = window.prompt('Name this palette (optional):') ?? undefined
    const saved = savePalette(history, name)
    window.alert(`Saved: ${saved.name}`)
  }, [history])

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
    </div>
  )
}

export default App
