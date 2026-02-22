export type SavedPalette = {
  id: string
  name: string
  colors: string[]
  savedAt: string
}

const STORAGE_KEY = 'color-palette:saved'
const HISTORY_KEY = 'color-palette:history'
const MAX_HISTORY_ENTRIES = 2048
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000

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
  const id = crypto.randomUUID()
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

export function setAllPalettes(next: SavedPalette[]): void {
  write(next)
}

export function loadPersistedHistory(): { history: string[][]; index: number } | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const { history, index, savedAt } = parsed as { history: unknown; index: unknown; savedAt: unknown }
    if (!Array.isArray(history) || typeof index !== 'number') return null
    const valid = history.filter((entry): entry is string[] =>
      Array.isArray(entry) && entry.every(c => typeof c === 'string')
    )
    if (valid.length === 0) return null
    const expired = typeof savedAt !== 'number' || Date.now() - savedAt > SESSION_TIMEOUT_MS
    return { history: valid, index: expired ? -1 : Math.max(-1, Math.min(index, valid.length - 1)) }
  } catch {
    return null
  }
}

export function persistHistory(history: string[][], index: number): void {
  if (history.length === 0) return
  try {
    const savedAt = Date.now()
    if (history.length <= MAX_HISTORY_ENTRIES) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ history, index, savedAt }))
      return
    }
    const trim = history.length - MAX_HISTORY_ENTRIES
    const capped = history.slice(trim)
    const cappedIndex = Math.max(0, index - trim)
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ history: capped, index: cappedIndex, savedAt }))
  } catch {
    // localStorage full or unavailable
  }
}

// Export/Import file format
export type PaletteExportFormat = {
  version: '1.0'
  exportedAt: string
  palettes: SavedPalette[]
}

export function exportAllPalettes(): void {
  const palettes = read()
  const exportData: PaletteExportFormat = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    palettes
  }
  
  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `color-palettes-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export function importPalettesFromFile(file: File): Promise<SavedPalette[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content) as unknown
        
        // Validate format
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid file format')
        }
        
        const exportData = data as PaletteExportFormat
        
        if (!exportData.version || !exportData.palettes || !Array.isArray(exportData.palettes)) {
          throw new Error('Invalid palette file format')
        }
        
        // Validate each palette
        const validPalettes = exportData.palettes.filter((p) =>
          p && 
          typeof p === 'object' && 
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          Array.isArray(p.colors) &&
          typeof p.savedAt === 'string'
        ) as SavedPalette[]
        
        resolve(validPalettes)
      } catch (error) {
        reject(new Error(`Failed to parse palette file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

export function mergePalettes(importedPalettes: SavedPalette[]): { imported: number; duplicates: number } {
  const existing = read()
  const existingIds = new Set(existing.map(p => p.id))
  
  let duplicateCount = 0
  let importedCount = 0
  
  // Filter out duplicates and only import new palettes
  const newPalettes = importedPalettes.filter(palette => {
    if (existingIds.has(palette.id)) {
      duplicateCount++
      return false // Skip duplicate
    } else {
      importedCount++
      return true // Import new palette
    }
  })
  
  const allPalettes = [...existing, ...newPalettes]
  write(allPalettes)
  
  return { imported: importedCount, duplicates: duplicateCount }
}


