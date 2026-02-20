import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  hexToHsl,
  hslToHex,
  clamp,
  formatColor,
  generateRelatedColor,
  generatePresetPalette,
  generateTints,
  generateShades,
  generateTones,
  isPresetActive,
  PALETTE_PRESETS,
} from '@/helpers/colorTheory'

describe('hexToRgb', () => {
  it('parses pure red', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })
  it('parses pure green', () => {
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
  })
  it('parses pure blue', () => {
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
  })
  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })
  it('parses white', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })
  it('strips leading # before parsing', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })
  it('parses a mid-range color', () => {
    const result = hexToRgb('#804020')
    expect(result.r).toBe(128)
    expect(result.g).toBe(64)
    expect(result.b).toBe(32)
  })
})

describe('hexToHsl', () => {
  it('red is hue=0', () => {
    const hsl = hexToHsl('#ff0000')
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })
  it('green is hue=120', () => {
    const hsl = hexToHsl('#00ff00')
    expect(hsl.h).toBe(120)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })
  it('blue is hue=240', () => {
    const hsl = hexToHsl('#0000ff')
    expect(hsl.h).toBe(240)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })
  it('black has saturation=0, lightness=0', () => {
    const hsl = hexToHsl('#000000')
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(0)
  })
  it('white has saturation=0, lightness=100', () => {
    const hsl = hexToHsl('#ffffff')
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(100)
  })
  it('returns h in 0-360 range', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    for (const hex of colors) {
      const { h } = hexToHsl(hex)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(360)
    }
  })
  it('returns s in 0-100 range', () => {
    const { s } = hexToHsl('#7f3f1f')
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
  it('returns l in 0-100 range', () => {
    const { l } = hexToHsl('#7f3f1f')
    expect(l).toBeGreaterThanOrEqual(0)
    expect(l).toBeLessThanOrEqual(100)
  })
})

describe('hslToHex', () => {
  it('h=0 gives red', () => {
    expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe('#ff0000')
  })
  it('h=120 gives green', () => {
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00')
  })
  it('h=240 gives blue', () => {
    expect(hslToHex({ h: 240, s: 100, l: 50 })).toBe('#0000ff')
  })
  it('s=0 gives gray (any hue)', () => {
    const result = hslToHex({ h: 180, s: 0, l: 50 })
    const r = parseInt(result.slice(1, 3), 16)
    const g = parseInt(result.slice(3, 5), 16)
    const b = parseInt(result.slice(5, 7), 16)
    expect(r).toBe(g)
    expect(g).toBe(b)
  })
  it('l=0 gives black regardless of hue/saturation', () => {
    expect(hslToHex({ h: 90, s: 100, l: 0 })).toBe('#000000')
  })
  it('l=100 gives white regardless of hue/saturation', () => {
    expect(hslToHex({ h: 90, s: 100, l: 100 })).toBe('#ffffff')
  })

  // THE KEY BUG REGRESSION TEST
  // Before fix: h=360 → hNorm=1.0 → no branch matched → rPrime=gPrime=bPrime=0 → gray
  // Fix: normalize with (((h % 360) + 360) % 360) / 360 so 360 maps to 0
  it('h=360 produces the same result as h=0 (not gray)', () => {
    const at0 = hslToHex({ h: 0, s: 100, l: 50 })
    const at360 = hslToHex({ h: 360, s: 100, l: 50 })
    expect(at360).toBe(at0)
    expect(at360).toBe('#ff0000')
  })
  it('h=361 normalizes correctly (wraps to 1°)', () => {
    const at1 = hslToHex({ h: 1, s: 100, l: 50 })
    const at361 = hslToHex({ h: 361, s: 100, l: 50 })
    expect(at361).toBe(at1)
  })
  it('negative hue normalizes correctly (h=-10 equals h=350)', () => {
    const atNeg10 = hslToHex({ h: -10, s: 100, l: 50 })
    const at350 = hslToHex({ h: 350, s: 100, l: 50 })
    expect(atNeg10).toBe(at350)
  })
  it('round-trips through hexToHsl within 1-channel rounding tolerance', () => {
    const original = '#3498db'
    const roundTripped = hslToHex(hexToHsl(original))
    const parse = (h: string) => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ]
    const [r1, g1, b1] = parse(original)
    const [r2, g2, b2] = parse(roundTripped)
    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(1)
    expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(1)
    expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(1)
  })
  it('output always starts with #', () => {
    expect(hslToHex({ h: 180, s: 60, l: 50 }).startsWith('#')).toBe(true)
  })
  it('output is always 7 characters', () => {
    expect(hslToHex({ h: 180, s: 60, l: 50 })).toHaveLength(7)
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('returns min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })
  it('returns max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
  it('returns value at exact min boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0)
  })
  it('returns value at exact max boundary', () => {
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('formatColor', () => {
  const hex = '#ff5733'

  it('hex format returns lowercase hex', () => {
    expect(formatColor('#FF5733', 'hex')).toBe('#ff5733')
  })
  it('rgb format returns rgb(...) string', () => {
    expect(formatColor(hex, 'rgb')).toBe('rgb(255, 87, 51)')
  })
  it('hsl format returns hsl(...) string', () => {
    const result = formatColor(hex, 'hsl')
    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
  })
  it('css-var format uses default varName "primary"', () => {
    expect(formatColor(hex, 'css-var')).toBe('--color-primary: #ff5733;')
  })
  it('css-var format uses custom varName', () => {
    expect(formatColor(hex, 'css-var', 'brand')).toBe('--color-brand: #ff5733;')
  })
  it('tailwind format wraps in single quotes', () => {
    const result = formatColor(hex, 'tailwind', 'accent')
    expect(result).toBe("'accent': '#ff5733'")
  })
  it('scss format uses $ prefix', () => {
    expect(formatColor(hex, 'scss', 'base')).toBe('$color-base: #ff5733;')
  })
})

describe('generateRelatedColor', () => {
  it('random relationship returns a valid hex color', () => {
    const result = generateRelatedColor([], 'random')
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('all relationships return valid hex strings', () => {
    const relationships = [
      'complementary', 'analogous', 'triadic', 'tetradic',
      'split-complementary', 'monochromatic', 'random',
    ] as const
    for (const rel of relationships) {
      const result = generateRelatedColor(['#3498db'], rel)
      expect(result).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('monochromatic result shares the same hue as reference', () => {
    // Monochromatic keeps h = baseHsl.h unchanged
    const ref = '#ff0000' // h=0
    const result = generateRelatedColor([ref], 'monochromatic')
    const { h } = hexToHsl(result)
    expect(h).toBeLessThan(5)
  })

  it('empty reference with fallback still returns valid hex', () => {
    const result = generateRelatedColor([], 'complementary', '#0000ff')
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('complementary returns valid hex', () => {
    const result = generateRelatedColor(['#ff0000'], 'complementary')
    expect(result).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('generatePresetPalette', () => {
  it('returns correct number of colors (default 5)', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'pastel')!
    const result = generatePresetPalette(preset)
    expect(result).toHaveLength(5)
  })

  it('returns correct number of colors (custom count)', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'neon')!
    const result = generatePresetPalette(preset, 3)
    expect(result).toHaveLength(3)
  })

  it('all returned values are valid hex strings', () => {
    for (const preset of PALETTE_PRESETS) {
      const results = generatePresetPalette(preset, 5)
      for (const hex of results) {
        expect(hex).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  it('monochrome preset produces near-zero saturation colors', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'monochrome')!
    for (let i = 0; i < 5; i++) {
      const results = generatePresetPalette(preset, 5)
      for (const hex of results) {
        const { s } = hexToHsl(hex)
        expect(s).toBeLessThanOrEqual(7) // range is 0-5 + 2° tolerance
      }
    }
  })

  it('pastel preset produces high-lightness colors', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'pastel')!
    for (let i = 0; i < 3; i++) {
      const results = generatePresetPalette(preset, 5)
      for (const hex of results) {
        const { l } = hexToHsl(hex)
        expect(l).toBeGreaterThanOrEqual(70)
        expect(l).toBeLessThanOrEqual(93)
      }
    }
  })
})

describe('isPresetActive', () => {
  it('returns false for empty color array', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'pastel')!
    expect(isPresetActive([], preset)).toBe(false)
  })

  it('returns true when all colors are within preset bounds', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'monochrome')!
    // Monochrome: s=0-5, l=15-90 — pure gray is s=0, l=50
    expect(isPresetActive(['#808080', '#404040', '#c0c0c0'], preset)).toBe(true)
  })

  it('returns false when any color is outside preset bounds', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'pastel')!
    // Pure saturated red (#ff0000) is outside pastel saturation range (25-45)
    expect(isPresetActive(['#ff0000'], preset)).toBe(false)
  })

  it('applies 2° tolerance on saturation boundaries', () => {
    const preset = PALETTE_PRESETS.find(p => p.id === 'pastel')!
    // Pastel saturation min is 25; s=23 should still pass with 2° tolerance
    const slightlyOutside = hslToHex({ h: 180, s: 23, l: 80 })
    expect(isPresetActive([slightlyOutside], preset)).toBe(true)
  })
})

describe('PALETTE_PRESETS constant', () => {
  it('has exactly 8 presets', () => {
    expect(PALETTE_PRESETS).toHaveLength(8)
  })

  it('all presets have required fields', () => {
    for (const preset of PALETTE_PRESETS) {
      expect(typeof preset.id).toBe('string')
      expect(typeof preset.label).toBe('string')
      expect(typeof preset.description).toBe('string')
      expect(Array.isArray(preset.hue)).toBe(true)
      expect(preset.hue).toHaveLength(2)
      expect(Array.isArray(preset.saturation)).toBe(true)
      expect(preset.saturation).toHaveLength(2)
      expect(Array.isArray(preset.lightness)).toBe(true)
      expect(preset.lightness).toHaveLength(2)
    }
  })

  it('preset ids are unique', () => {
    const ids = PALETTE_PRESETS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes all expected preset ids', () => {
    const ids = PALETTE_PRESETS.map(p => p.id)
    expect(ids).toContain('pastel')
    expect(ids).toContain('neon')
    expect(ids).toContain('earth')
    expect(ids).toContain('jewel')
    expect(ids).toContain('monochrome')
    expect(ids).toContain('warm')
    expect(ids).toContain('cool')
    expect(ids).toContain('muted')
  })

  it('warm preset has wrapping hue range (min > max)', () => {
    const warm = PALETTE_PRESETS.find(p => p.id === 'warm')!
    expect(warm.hue[0]).toBeGreaterThan(warm.hue[1])
  })
})

describe('generateTints', () => {
  it('returns correct count (default 9)', () => {
    expect(generateTints('#3498db')).toHaveLength(9)
  })
  it('returns correct count (custom)', () => {
    expect(generateTints('#3498db', 5)).toHaveLength(5)
  })
  it('all values are valid hex strings', () => {
    for (const hex of generateTints('#3498db')) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
  it('tints get progressively lighter (monotonically non-decreasing lightness)', () => {
    const tints = generateTints('#3498db')
    const lightnesses = tints.map(h => hexToHsl(h).l)
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeGreaterThanOrEqual(lightnesses[i - 1] - 1) // allow 1 unit rounding
    }
  })
  it('preserves the hue of the source color (within 5° round-trip rounding)', () => {
    // generateTints passes h directly from hexToHsl → hslToHex → hexToHsl round-trip.
    // Integer rounding in RGB channels can introduce up to ~3° hue drift; 5° is safe.
    const source = '#3498db'
    const sourceHue = hexToHsl(source).h
    for (const tint of generateTints(source)) {
      expect(Math.abs(hexToHsl(tint).h - sourceHue)).toBeLessThanOrEqual(5)
    }
  })
})

describe('generateShades', () => {
  it('returns correct count', () => {
    expect(generateShades('#3498db')).toHaveLength(9)
  })
  it('shades get progressively darker (monotonically non-increasing lightness)', () => {
    const shades = generateShades('#3498db')
    const lightnesses = shades.map(h => hexToHsl(h).l)
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeLessThanOrEqual(lightnesses[i - 1] + 1)
    }
  })
  it('all values are valid hex strings', () => {
    for (const hex of generateShades('#3498db')) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('generateTones', () => {
  it('returns correct count', () => {
    expect(generateTones('#3498db')).toHaveLength(9)
  })
  it('tones get progressively less saturated', () => {
    const tones = generateTones('#3498db')
    const sats = tones.map(h => hexToHsl(h).s)
    for (let i = 1; i < sats.length; i++) {
      expect(sats[i]).toBeLessThanOrEqual(sats[i - 1] + 1)
    }
  })
  it('lightness is preserved within 1 unit of source', () => {
    const source = '#3498db'
    const sourceL = hexToHsl(source).l
    for (const tone of generateTones(source)) {
      expect(Math.abs(hexToHsl(tone).l - sourceL)).toBeLessThanOrEqual(1)
    }
  })
})
