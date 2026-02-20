import { describe, it, expect, vi } from 'vitest'
import {
  getSavedPalettes,
  savePalette,
  removePalette,
  setAllPalettes,
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
      { id: 'a', name: 'A', colors: ['#111'], savedAt: '' },
      { id: 'b', name: 'B', colors: ['#222'], savedAt: '' },
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
      { id: existingId, name: 'Duplicate', colors: ['#111'], savedAt: '' },
      { id: 'brand-new', name: 'New', colors: ['#222'], savedAt: '' },
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
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })

  it('rejects when palettes field is missing', async () => {
    const invalid = { version: '1.0', exportedAt: '' }
    await expect(importPalettesFromFile(makeFile(invalid))).rejects.toThrow()
  })

  it('rejects when JSON is malformed', async () => {
    const file = new File(['NOT JSON {{{'], 'bad.json', { type: 'application/json' })
    await expect(importPalettesFromFile(file)).rejects.toThrow()
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
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
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
