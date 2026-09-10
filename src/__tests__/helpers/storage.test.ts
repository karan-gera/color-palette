import { describe, it, expect, vi } from 'vitest'
import {
  getSavedPalettes,
  savePalette,
  updatePalette,
  getAllTags,
  removePalette,
  setAllPalettes,
  getCollections,
  saveCollection,
  renameCollection,
  removeCollection,
  loadPersistedHistory,
  persistHistory,
  mergePalettes,
  importPalettesFromFile,
  exportAllPalettes,
} from '@/helpers/storage'
import type { SavedPalette } from '@/helpers/storage'

// localStorage is provided by jsdom and cleared in setup.ts afterEach

describe('getSavedPalettes', () => {
  it('returns empty array when storage is empty', () => {
    expect(getSavedPalettes()).toEqual([])
  })

  it('returns parsed palettes from storage', () => {
    const palette: SavedPalette = {
      id: 'test-id',
      name: 'Test',
      colors: ['#ff0000'],
      savedAt: new Date().toISOString(),
      tags: [],
    }
    localStorage.setItem('color-palette:saved', JSON.stringify([palette]))
    const result = getSavedPalettes()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('test-id')
  })

  it('returns empty array for corrupted JSON', () => {
    localStorage.setItem('color-palette:saved', 'NOT_VALID_JSON{{{')
    expect(getSavedPalettes()).toEqual([])
  })

  it('returns empty array when stored value is not an array', () => {
    localStorage.setItem('color-palette:saved', JSON.stringify({ invalid: true }))
    expect(getSavedPalettes()).toEqual([])
  })

  it('filters out entries without a colors array', () => {
    const data = [
      { id: 'valid', name: 'Good', colors: ['#fff'], savedAt: '' },
      { id: 'bad', name: 'Bad' }, // missing colors
    ]
    localStorage.setItem('color-palette:saved', JSON.stringify(data))
    const result = getSavedPalettes()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('valid')
  })

  it('migrates palettes without tags to an empty tag list', () => {
    localStorage.setItem('color-palette:saved', JSON.stringify([
      { id: 'legacy', name: 'Legacy', colors: ['#fff'], savedAt: '' },
    ]))

    expect(getSavedPalettes()[0].tags).toEqual([])
  })
})

describe('savePalette', () => {
  it('stores a palette and returns it', () => {
    const saved = savePalette(['#ff0000', '#00ff00'], 'My Palette')
    expect(saved.name).toBe('My Palette')
    expect(saved.colors).toEqual(['#ff0000', '#00ff00'])
  })

  it('appends to existing palettes', () => {
    savePalette(['#111111'], 'First')
    savePalette(['#222222'], 'Second')
    expect(getSavedPalettes()).toHaveLength(2)
  })

  it('generates a UUID matching 8-4-4-4-12 format', () => {
    const saved = savePalette(['#ff0000'])
    expect(saved.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  })

  it('uses default name with "Palette" prefix when name omitted', () => {
    const saved = savePalette(['#ff0000'])
    expect(saved.name).toMatch(/^Palette /)
  })

  it('uses custom name when provided', () => {
    const saved = savePalette(['#ff0000'], 'Brand Colors')
    expect(saved.name).toBe('Brand Colors')
  })

  it('savedAt is an ISO date string', () => {
    const saved = savePalette(['#ff0000'])
    expect(() => new Date(saved.savedAt)).not.toThrow()
    expect(new Date(saved.savedAt).toISOString()).toBe(saved.savedAt)
  })

  it('colors array is a copy, not a reference', () => {
    const colors = ['#ff0000']
    const saved = savePalette(colors)
    colors.push('#00ff00')
    expect(saved.colors).toHaveLength(1)
  })

  it('persists tags and a collection when provided', () => {
    const saved = savePalette(['#ff0000'], 'Brand', ['ui', 'warm'], 'Client')

    expect(saved.tags).toEqual(['ui', 'warm'])
    expect(saved.collection).toBe('Client')
    expect(getSavedPalettes()[0]).toEqual(saved)
  })
})

describe('palette metadata', () => {
  it('updates only the matching palette', () => {
    const first = savePalette(['#111111'], 'First')
    const second = savePalette(['#222222'], 'Second')

    updatePalette(first.id, { name: 'Updated', tags: ['ui'], collection: 'Work' })

    const palettes = getSavedPalettes()
    expect(palettes.find(palette => palette.id === first.id)).toMatchObject({
      name: 'Updated',
      tags: ['ui'],
      collection: 'Work',
    })
    expect(palettes.find(palette => palette.id === second.id)?.name).toBe('Second')
  })

  it('returns unique tags in sorted order', () => {
    savePalette(['#111111'], 'First', ['warm', 'ui'])
    savePalette(['#222222'], 'Second', ['brand', 'ui'])

    expect(getAllTags()).toEqual(['brand', 'ui', 'warm'])
  })
})

describe('collections', () => {
  it('starts empty and ignores malformed collection storage', () => {
    expect(getCollections()).toEqual([])

    localStorage.setItem('color-palette:collections', '{broken')
    expect(getCollections()).toEqual([])

    localStorage.setItem('color-palette:collections', JSON.stringify([
      { name: 'Valid', createdAt: '' },
      { createdAt: '', invalid: true },
    ]))
    expect(getCollections()).toEqual([{ name: 'Valid', createdAt: '' }])
  })

  it('saves a collection and rejects an exact duplicate name', () => {
    const saved = saveCollection('Client')

    expect(saved).toMatchObject({ name: 'Client' })
    expect(getCollections()).toEqual([saved])
    expect(saveCollection('Client')).toBeNull()
    expect(getCollections()).toHaveLength(1)
  })

  it('renames a collection and updates assigned palettes', () => {
    saveCollection('Old')
    const palette = savePalette(['#111111'], 'Palette', [], 'Old')

    expect(renameCollection('Old', 'New')).toBe(true)

    expect(getCollections().map(collection => collection.name)).toEqual(['New'])
    expect(getSavedPalettes().find(item => item.id === palette.id)?.collection).toBe('New')
  })

  it('does not overwrite an existing collection during rename', () => {
    saveCollection('First')
    saveCollection('Second')

    expect(renameCollection('First', 'Second')).toBe(false)
    expect(getCollections().map(collection => collection.name)).toEqual(['First', 'Second'])
  })

  it('removes a collection and moves its palettes to uncategorized', () => {
    saveCollection('Client')
    const palette = savePalette(['#111111'], 'Palette', [], 'Client')

    removeCollection('Client')

    expect(getCollections()).toEqual([])
    expect(getSavedPalettes().find(item => item.id === palette.id)?.collection).toBeUndefined()
  })
})

describe('persisted history', () => {
  it('returns null for absent or malformed history', () => {
    expect(loadPersistedHistory()).toBeNull()

    localStorage.setItem('color-palette:history', JSON.stringify({ history: 'nope', index: 0 }))
    expect(loadPersistedHistory()).toBeNull()
  })

  it('filters invalid entries and clamps the active index', () => {
    localStorage.setItem('color-palette:history', JSON.stringify({
      history: [['#111111'], [42], ['#222222']],
      index: 99,
      savedAt: Date.now(),
    }))

    expect(loadPersistedHistory()).toEqual({
      history: [['#111111'], ['#222222']],
      index: 1,
    })
  })

  it('keeps expired history but resets its active index', () => {
    localStorage.setItem('color-palette:history', JSON.stringify({
      history: [['#111111']],
      index: 0,
      savedAt: Date.now() - 9 * 60 * 60 * 1000,
    }))

    expect(loadPersistedHistory()).toEqual({ history: [['#111111']], index: -1 })
  })

  it('persists history with a timestamp and active index', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456)

    persistHistory([['#111111'], ['#222222']], 1)

    expect(JSON.parse(localStorage.getItem('color-palette:history') ?? '')).toEqual({
      history: [['#111111'], ['#222222']],
      index: 1,
      savedAt: 123456,
    })
    vi.restoreAllMocks()
  })

  it('does not write empty history', () => {
    persistHistory([], -1)

    expect(localStorage.getItem('color-palette:history')).toBeNull()
  })

  it('caps persisted history at 2048 entries and adjusts its index', () => {
    const history = Array.from({ length: 2050 }, (_, index) => [`#${index.toString(16).padStart(6, '0')}`])

    persistHistory(history, 2049)

    const stored = JSON.parse(localStorage.getItem('color-palette:history') ?? '')
    expect(stored.history).toHaveLength(2048)
    expect(stored.history[0]).toEqual(history[2])
    expect(stored.index).toBe(2047)
  })
})

describe('removePalette', () => {
  it('removes the palette with matching id', () => {
    const p1 = savePalette(['#111111'], 'One')
    const p2 = savePalette(['#222222'], 'Two')
    removePalette(p1.id)
    const remaining = getSavedPalettes()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(p2.id)
  })

  it('does not affect other palettes', () => {
    const p1 = savePalette(['#111111'], 'One')
    savePalette(['#222222'], 'Two')
    removePalette(p1.id)
    expect(getSavedPalettes()[0].name).toBe('Two')
  })

  it('is a no-op for a non-existent id', () => {
    savePalette(['#111111'], 'One')
    removePalette('nonexistent-id')
    expect(getSavedPalettes()).toHaveLength(1)
  })
})

describe('setAllPalettes', () => {
  it('replaces entire storage with new array', () => {
    savePalette(['#111111'], 'Old')
    const newPalettes: SavedPalette[] = [{
      id: 'new-id',
      name: 'New',
      colors: ['#ffffff'],
      savedAt: new Date().toISOString(),
      tags: [],
    }]
    setAllPalettes(newPalettes)
    const result = getSavedPalettes()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('new-id')
  })

  it('can set to empty array (clears all saves)', () => {
    savePalette(['#111111'], 'Old')
    setAllPalettes([])
    expect(getSavedPalettes()).toEqual([])
  })
})

describe('mergePalettes', () => {
  it('imports all palettes when storage is empty', () => {
    const imported: SavedPalette[] = [
      { id: 'a', name: 'A', colors: ['#111'], savedAt: '', tags: [] },
      { id: 'b', name: 'B', colors: ['#222'], savedAt: '', tags: [] },
    ]
    const result = mergePalettes(imported)
    expect(result.imported).toBe(2)
    expect(result.duplicates).toBe(0)
    expect(getSavedPalettes()).toHaveLength(2)
  })

  it('skips palettes with duplicate ids', () => {
    savePalette(['#111111'], 'Existing')
    const existingId = getSavedPalettes()[0].id
    const imported: SavedPalette[] = [
      { id: existingId, name: 'Duplicate', colors: ['#111'], savedAt: '', tags: [] },
      { id: 'brand-new', name: 'New', colors: ['#222'], savedAt: '', tags: [] },
    ]
    const result = mergePalettes(imported)
    expect(result.imported).toBe(1)
    expect(result.duplicates).toBe(1)
    expect(getSavedPalettes()).toHaveLength(2)
  })

  it('returns correct counts when all are duplicates', () => {
    const palette = savePalette(['#111'], 'One')
    const result = mergePalettes([palette])
    expect(result.imported).toBe(0)
    expect(result.duplicates).toBe(1)
  })

  it('merges only collections whose names do not already exist', () => {
    saveCollection('Existing')

    const result = mergePalettes([], [
      { name: 'Existing', createdAt: 'old' },
      { name: 'Imported', createdAt: 'new' },
    ])

    expect(result.collectionsImported).toBe(1)
    expect(getCollections().map(collection => collection.name)).toEqual(['Existing', 'Imported'])
  })
})

describe('importPalettesFromFile', () => {
  function makeFile(content: unknown): File {
    return new File([JSON.stringify(content)], 'palettes.json', { type: 'application/json' })
  }

  it('resolves with valid palette array from valid export format', async () => {
    const validExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      palettes: [
        { id: 'a', name: 'A', colors: ['#ff0000'], savedAt: '' },
      ],
    }
    const result = await importPalettesFromFile(makeFile(validExport))
    expect(result.palettes).toHaveLength(1)
    expect(result.palettes[0].id).toBe('a')
    expect(result.collections).toHaveLength(0)
  })

  it('rejects when palettes field is missing', async () => {
    const invalid = { version: '1.0', exportedAt: '' }
    await expect(importPalettesFromFile(makeFile(invalid))).rejects.toThrow()
  })

  it('rejects when JSON is malformed', async () => {
    const file = new File(['NOT JSON {{{'], 'bad.json', { type: 'application/json' })
    await expect(importPalettesFromFile(file)).rejects.toThrow()
  })

  it('rejects when FileReader cannot read the file', async () => {
    class FailingFileReader {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null
      onerror: (() => void) | null = null

      readAsText() {
        this.onerror?.()
      }
    }
    vi.stubGlobal('FileReader', FailingFileReader)

    try {
      await expect(importPalettesFromFile(makeFile({}))).rejects.toThrow('Failed to read file')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('filters out palette entries missing required fields', async () => {
    const validExport = {
      version: '1.0',
      exportedAt: '',
      palettes: [
        { id: 'a', name: 'A', colors: ['#ff0000'], savedAt: '' }, // valid
        { id: 'b', name: 'B', savedAt: '' }, // missing colors
        { id: 'c', colors: ['#ff0000'], savedAt: '' }, // missing name
      ],
    }
    const result = await importPalettesFromFile(makeFile(validExport))
    expect(result.palettes).toHaveLength(1)
    expect(result.palettes[0].id).toBe('a')
  })

  it('imports collections when present in export', async () => {
    const validExport = {
      version: '1.0',
      exportedAt: '',
      palettes: [{ id: 'a', name: 'A', colors: ['#ff0000'], savedAt: '', collection: 'Brand' }],
      collections: [{ name: 'Brand', createdAt: '' }],
    }
    const result = await importPalettesFromFile(makeFile(validExport))
    expect(result.collections).toHaveLength(1)
    expect(result.collections[0].name).toBe('Brand')
  })

  it('migrates missing tags and filters invalid collections', async () => {
    const result = await importPalettesFromFile(makeFile({
      version: '1.0',
      exportedAt: '',
      palettes: [{ id: 'a', name: 'A', colors: ['#ff0000'], savedAt: '' }],
      collections: [{ name: 'Valid', createdAt: '' }, { createdAt: '' }],
    }))

    expect(result.palettes[0].tags).toEqual([])
    expect(result.collections).toEqual([{ name: 'Valid', createdAt: '' }])
  })
})

describe('exportAllPalettes', () => {
  it('triggers a DOM download link click', () => {
    savePalette(['#ff0000'], 'Test')

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => node)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(node => node)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    })

    exportAllPalettes()

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockLink.click).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})
