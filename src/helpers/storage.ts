export type SavedPalette = {
  id: string
  name: string
  colors: string[]
  savedAt: string
}

const STORAGE_KEY = 'color-palette:saved'

function read(): SavedPalette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Basic structural validation
    return parsed.filter((p) =>
      p && typeof p === 'object' && Array.isArray((p as SavedPalette).colors)
    ) as SavedPalette[]
  } catch {
    return []
  }
}

function write(palettes: SavedPalette[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes))
}

export function getSavedPalettes(): SavedPalette[] {
  return read()
}

export function savePalette(colors: string[], name?: string): SavedPalette {
  const palettes = read()
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const saved: SavedPalette = {
    id,
    name: name ?? `Palette ${new Date().toLocaleString()}`,
    colors: [...colors],
    savedAt: new Date().toISOString(),
  }
  palettes.push(saved)
  write(palettes)
  return saved
}

export function removePalette(id: string): void {
  const palettes = read().filter((p) => p.id !== id)
  write(palettes)
}


