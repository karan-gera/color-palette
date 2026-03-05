export type SavedPalette = {
  id: string
  name: string
  colors: string[]
  savedAt: string
  tags: string[]
  collection?: string
}

export type PaletteCollection = {
  name: string
  createdAt: string
}

const STORAGE_KEY = 'color-palette:saved'
const COLLECTIONS_KEY = 'color-palette:collections'
const HISTORY_KEY = 'color-palette:history'
const MAX_HISTORY_ENTRIES = 2048
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000

function read(): SavedPalette[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Basic structural validation + forward-compat migration
    return parsed
      .filter((p) => p && typeof p === 'object' && Array.isArray((p as SavedPalette).colors))
      .map((p) => ({
        ...(p as SavedPalette),
        tags: Array.isArray((p as SavedPalette).tags) ? (p as SavedPalette).tags : [],
      })) as SavedPalette[]
  } catch (e) {
    console.warn('[storage] Failed to read palettes:', e)
    return []
  }
}

function write(palettes: SavedPalette[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes))
  } catch (e) {
    console.warn('[storage] Failed to write palettes:', e)
  }
}

export function getSavedPalettes(): SavedPalette[] {
  return read()
}

export function savePalette(colors: string[], name?: string, tags?: string[], collection?: string): SavedPalette {
  const palettes = read()
  const id = crypto.randomUUID()
  const saved: SavedPalette = {
    id,
    name: name ?? `Palette ${new Date().toLocaleString()}`,
    colors: [...colors],
    savedAt: new Date().toISOString(),
    tags: tags ?? [],
    ...(collection ? { collection } : {}),
  }
  palettes.push(saved)
  write(palettes)
  return saved
}

export function updatePalette(id: string, updates: Partial<Pick<SavedPalette, 'name' | 'tags' | 'collection'>>): void {
  const palettes = read().map((p) =>
    p.id === id ? { ...p, ...updates } : p
  )
  write(palettes)
}

export function getAllTags(): string[] {
  const all = read().flatMap((p) => p.tags)
  return [...new Set(all)].sort()
}

export function removePalette(id: string): void {
  const palettes = read().filter((p) => p.id !== id)
  write(palettes)
}

export function setAllPalettes(next: SavedPalette[]): void {
  write(next)
}

// ─── Collections ───────────────────────────────────────────────────────────

function readCollections(): PaletteCollection[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((c) =>
      c && typeof c === 'object' &&
      typeof (c as PaletteCollection).name === 'string'
    ) as PaletteCollection[]
  } catch {
    return []
  }
}

function writeCollections(collections: PaletteCollection[]): void {
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
  } catch (e) {
    console.warn('[storage] Failed to write collections:', e)
  }
}

export function getCollections(): PaletteCollection[] {
  return readCollections()
}

export function saveCollection(name: string): PaletteCollection | null {
  const collections = readCollections()
  if (collections.some((c) => c.name === name)) return null
  const collection: PaletteCollection = {
    name,
    createdAt: new Date().toISOString(),
  }
  collections.push(collection)
  writeCollections(collections)
  return collection
}

export function renameCollection(oldName: string, newName: string): void {
  const collections = readCollections()
  if (collections.some((c) => c.name === newName)) return
  writeCollections(collections.map((c) =>
    c.name === oldName ? { ...c, name: newName } : c
  ))
  const palettes = read().map((p) =>
    p.collection === oldName ? { ...p, collection: newName } : p
  )
  write(palettes)
}

export function removeCollection(name: string): void {
  writeCollections(readCollections().filter((c) => c.name !== name))
  const palettes = read().map((p) =>
    p.collection === name ? { ...p, collection: undefined } : p
  )
  write(palettes)
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
  } catch (e) {
    console.warn('[storage] Failed to persist history:', e)
  }
}

// Export/Import file format
export type PaletteExportFormat = {
  version: '1.0'
  exportedAt: string
  palettes: SavedPalette[]
  collections?: PaletteCollection[]
}

export function exportAllPalettes(): void {
  const palettes = read()
  const collections = readCollections()
  const exportData: PaletteExportFormat = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    palettes,
    ...(collections.length > 0 ? { collections } : {}),
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

export type ImportedData = {
  palettes: SavedPalette[]
  collections: PaletteCollection[]
}

export function importPalettesFromFile(file: File): Promise<ImportedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content) as unknown
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid file format')
        }
        
        const exportData = data as PaletteExportFormat
        
        if (!exportData.version || !exportData.palettes || !Array.isArray(exportData.palettes)) {
          throw new Error('Invalid palette file format')
        }
        
        const validPalettes = exportData.palettes
          .filter((p) =>
            p &&
            typeof p === 'object' &&
            typeof p.id === 'string' &&
            typeof p.name === 'string' &&
            Array.isArray(p.colors) &&
            typeof p.savedAt === 'string'
          )
          .map((p) => ({
            ...p,
            tags: Array.isArray(p.tags) ? p.tags : [],
          })) as SavedPalette[]

        const validCollections = (Array.isArray(exportData.collections) ? exportData.collections : [])
          .filter((c) =>
            c &&
            typeof c === 'object' &&
            typeof (c as PaletteCollection).name === 'string'
          ) as PaletteCollection[]
        
        resolve({ palettes: validPalettes, collections: validCollections })
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

export function mergePalettes(
  importedPalettes: SavedPalette[],
  importedCollections: PaletteCollection[] = [],
): { imported: number; duplicates: number; collectionsImported: number } {
  const existing = read()
  const existingIds = new Set(existing.map(p => p.id))
  
  let duplicateCount = 0
  let importedCount = 0
  
  const newPalettes = importedPalettes.filter(palette => {
    if (existingIds.has(palette.id)) {
      duplicateCount++
      return false
    } else {
      importedCount++
      return true
    }
  })
  
  write([...existing, ...newPalettes])

  let collectionsImported = 0
  if (importedCollections.length > 0) {
    const existingCollections = readCollections()
    const existingNames = new Set(existingCollections.map(c => c.name))
    const newCollections = importedCollections.filter(c => !existingNames.has(c.name))
    if (newCollections.length > 0) {
      writeCollections([...existingCollections, ...newCollections])
      collectionsImported = newCollections.length
    }
  }
  
  return { imported: importedCount, duplicates: duplicateCount, collectionsImported }
}


