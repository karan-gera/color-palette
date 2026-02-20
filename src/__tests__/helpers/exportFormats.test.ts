import { describe, it, expect } from 'vitest'
import { exportPalette } from '@/helpers/exportFormats'

const COLORS = ['#ff5733', '#3498db', '#2ecc71']

describe('exportPalette - css', () => {
  it('starts with :root {', async () => {
    const result = await exportPalette(COLORS, 'css') as string
    expect(result.startsWith(':root {')).toBe(true)
  })
  it('contains --color-1 variable', async () => {
    const result = await exportPalette(COLORS, 'css') as string
    expect(result).toContain('--color-1:')
  })
  it('contains all colors indexed correctly', async () => {
    const result = await exportPalette(COLORS, 'css') as string
    expect(result).toContain('--color-1: #ff5733')
    expect(result).toContain('--color-2: #3498db')
    expect(result).toContain('--color-3: #2ecc71')
  })
})

describe('exportPalette - json', () => {
  it('produces valid JSON', async () => {
    const result = await exportPalette(COLORS, 'json') as string
    expect(() => JSON.parse(result)).not.toThrow()
  })
  it('JSON has a colors array of correct length', async () => {
    const result = await exportPalette(COLORS, 'json') as string
    const parsed = JSON.parse(result)
    expect(Array.isArray(parsed.colors)).toBe(true)
    expect(parsed.colors).toHaveLength(3)
  })
  it('colors array contains the correct hex values', async () => {
    const result = await exportPalette(COLORS, 'json') as string
    const parsed = JSON.parse(result)
    expect(parsed.colors).toEqual(COLORS)
  })
})

describe('exportPalette - tailwind', () => {
  it('contains module.exports', async () => {
    const result = await exportPalette(COLORS, 'tailwind') as string
    expect(result).toContain('module.exports')
  })
  it('contains single-quoted color keys', async () => {
    const result = await exportPalette(COLORS, 'tailwind') as string
    expect(result).toContain("'color-1'")
  })
  it('contains color values', async () => {
    const result = await exportPalette(COLORS, 'tailwind') as string
    expect(result).toContain('#ff5733')
  })
})

describe('exportPalette - scss', () => {
  it('each line starts with $color-', async () => {
    const result = await exportPalette(COLORS, 'scss') as string
    const lines = result.trim().split('\n')
    for (const line of lines) {
      expect(line.startsWith('$color-')).toBe(true)
    }
  })
  it('correct number of SCSS variables', async () => {
    const result = await exportPalette(COLORS, 'scss') as string
    expect(result.trim().split('\n')).toHaveLength(3)
  })
  it('contains correct hex values', async () => {
    const result = await exportPalette(COLORS, 'scss') as string
    expect(result).toContain('#ff5733')
    expect(result).toContain('#3498db')
  })
})

describe('exportPalette - gpl', () => {
  it('starts with GIMP Palette', async () => {
    const result = await exportPalette(COLORS, 'gpl') as string
    expect(result.startsWith('GIMP Palette')).toBe(true)
  })
  it('contains RGB triplet for #ff5733 (R:255 G:87 B:51)', async () => {
    const result = await exportPalette(COLORS, 'gpl') as string
    expect(result).toContain('255')
    expect(result).toContain(' 87')
    expect(result).toContain(' 51')
  })
  it('contains one line per color after the header', async () => {
    const result = await exportPalette(COLORS, 'gpl') as string
    // Header is 4 lines (GIMP Palette, Name, Columns, #), then one per color
    const lines = result.trim().split('\n').filter(l => !l.startsWith('GIMP') && !l.startsWith('Name') && !l.startsWith('Column') && l !== '#')
    expect(lines).toHaveLength(3)
  })
})

describe('exportPalette - paintnet', () => {
  it('starts with ; Paint.NET comment', async () => {
    const result = await exportPalette(COLORS, 'paintnet') as string
    expect(result.startsWith('; Paint.NET')).toBe(true)
  })
  it('color lines start with FF (fully opaque alpha)', async () => {
    const result = await exportPalette(COLORS, 'paintnet') as string
    const colorLines = result.split('\n').filter(l => !l.startsWith(';') && l.trim().length > 0)
    for (const line of colorLines) {
      expect(line.startsWith('FF')).toBe(true)
    }
  })
  it('color values are uppercase AARRGGBB', async () => {
    const result = await exportPalette(['#ff5733'], 'paintnet') as string
    expect(result).toContain('FFFF5733')
  })
})

describe('exportPalette - ase', () => {
  it('returns a Blob', async () => {
    const result = await exportPalette(COLORS, 'ase')
    expect(result).toBeInstanceOf(Blob)
  })
  it('Blob has non-zero size', async () => {
    const result = await exportPalette(COLORS, 'ase') as Blob
    expect(result.size).toBeGreaterThan(0)
  })
  it('first 4 bytes are ASEF signature (65, 83, 69, 70)', async () => {
    const result = await exportPalette(COLORS, 'ase') as Blob
    const buffer = await result.arrayBuffer()
    const bytes = new Uint8Array(buffer, 0, 4)
    expect(bytes[0]).toBe(65)  // A
    expect(bytes[1]).toBe(83)  // S
    expect(bytes[2]).toBe(69)  // E
    expect(bytes[3]).toBe(70)  // F
  })
})

describe('exportPalette - aco', () => {
  it('returns a Blob', async () => {
    const result = await exportPalette(COLORS, 'aco')
    expect(result).toBeInstanceOf(Blob)
  })
  it('Blob has non-zero size', async () => {
    const result = await exportPalette(COLORS, 'aco') as Blob
    expect(result.size).toBeGreaterThan(0)
  })
  it('ACO version 1 section starts at byte 0 with value 1', async () => {
    const result = await exportPalette(COLORS, 'aco') as Blob
    const buffer = await result.arrayBuffer()
    const view = new DataView(buffer)
    // First 2 bytes = version number (1 for ACO v1)
    expect(view.getUint16(0, false)).toBe(1)
  })
})

describe('exportPalette - procreate', () => {
  it('returns a Blob', async () => {
    const result = await exportPalette(COLORS, 'procreate')
    expect(result).toBeInstanceOf(Blob)
  })
  it('Blob has non-zero size', async () => {
    const result = await exportPalette(COLORS, 'procreate') as Blob
    expect(result.size).toBeGreaterThan(0)
  })
  it('starts with ZIP local file header signature (PK = 0x50, 0x4B)', async () => {
    const result = await exportPalette(COLORS, 'procreate') as Blob
    const buffer = await result.arrayBuffer()
    const bytes = new Uint8Array(buffer, 0, 4)
    expect(bytes[0]).toBe(0x50)  // P
    expect(bytes[1]).toBe(0x4B)  // K
  })
})
