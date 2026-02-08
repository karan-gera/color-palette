export type ColorRelationship = 
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'monochromatic'
  | 'random'

export type HSL = {
  h: number // 0-360
  s: number // 0-100
  l: number // 0-100
}

export type RGB = {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
}

export type ColorFormat = 
  | 'hex'
  | 'rgb'
  | 'hsl'
  | 'css-var'
  | 'tailwind'
  | 'scss'

export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '')
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  }
}

export function formatColor(hex: string, format: ColorFormat, varName = 'primary'): string {
  const cleanHex = hex.toLowerCase()
  
  switch (format) {
    case 'hex':
      return cleanHex
    case 'rgb': {
      const { r, g, b } = hexToRgb(hex)
      return `rgb(${r}, ${g}, ${b})`
    }
    case 'hsl': {
      const { h, s, l } = hexToHsl(hex)
      return `hsl(${h}, ${s}%, ${l}%)`
    }
    case 'css-var':
      return `--color-${varName}: ${cleanHex};`
    case 'tailwind':
      return `'${varName}': '${cleanHex}'`
    case 'scss':
      return `$color-${varName}: ${cleanHex};`
    default:
      return cleanHex
  }
}

export const COLOR_FORMATS: { value: ColorFormat; label: string; preview: (hex: string) => string }[] = [
  { value: 'hex', label: 'HEX', preview: (hex) => formatColor(hex, 'hex') },
  { value: 'rgb', label: 'RGB', preview: (hex) => formatColor(hex, 'rgb') },
  { value: 'hsl', label: 'HSL', preview: (hex) => formatColor(hex, 'hsl') },
  { value: 'css-var', label: 'CSS Variable', preview: (hex) => formatColor(hex, 'css-var') },
  { value: 'tailwind', label: 'Tailwind', preview: (hex) => formatColor(hex, 'tailwind') },
  { value: 'scss', label: 'SCSS', preview: (hex) => formatColor(hex, 'scss') },
]

export function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export function hslToHex({ h, s, l }: HSL): string {
  const hNorm = h / 360
  const sNorm = s / 100
  const lNorm = l / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs((hNorm * 6) % 2 - 1))
  const m = lNorm - c / 2

  let rPrime = 0, gPrime = 0, bPrime = 0

  if (0 <= hNorm && hNorm < 1/6) {
    rPrime = c; gPrime = x; bPrime = 0
  } else if (1/6 <= hNorm && hNorm < 2/6) {
    rPrime = x; gPrime = c; bPrime = 0
  } else if (2/6 <= hNorm && hNorm < 3/6) {
    rPrime = 0; gPrime = c; bPrime = x
  } else if (3/6 <= hNorm && hNorm < 4/6) {
    rPrime = 0; gPrime = x; bPrime = c
  } else if (4/6 <= hNorm && hNorm < 5/6) {
    rPrime = x; gPrime = 0; bPrime = c
  } else if (5/6 <= hNorm && hNorm < 1) {
    rPrime = c; gPrime = 0; bPrime = x
  }

  const r = Math.round((rPrime + m) * 255)
  const g = Math.round((gPrime + m) * 255)
  const b = Math.round((bPrime + m) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function getAverageHsl(colors: string[]): HSL {
  if (colors.length === 0) {
    return { h: 0, s: 50, l: 50 }
  }
  
  const hslValues = colors.map(hexToHsl)
  
  // Handle hue averaging (circular values)
  let sinSum = 0, cosSum = 0
  hslValues.forEach(hsl => {
    const radians = (hsl.h * Math.PI) / 180
    sinSum += Math.sin(radians)
    cosSum += Math.cos(radians)
  })
  
  const avgHue = normalizeHue((Math.atan2(sinSum, cosSum) * 180) / Math.PI)
  const avgSat = hslValues.reduce((sum, hsl) => sum + hsl.s, 0) / hslValues.length
  const avgLight = hslValues.reduce((sum, hsl) => sum + hsl.l, 0) / hslValues.length
  
  return { h: avgHue, s: avgSat, l: avgLight }
}

export function generateRelatedColor(
  referenceColors: string[], 
  relationship: ColorRelationship,
  fallbackColor?: string
): string {
  if (relationship === 'random') {
    const value = Math.floor(Math.random() * 0xffffff)
    return `#${value.toString(16).padStart(6, '0')}`
  }

  // Use locked colors as reference, fallback to provided color or random
  const baseColors = referenceColors.length > 0 ? referenceColors : 
    (fallbackColor ? [fallbackColor] : ['#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')])
  
  const baseHsl = getAverageHsl(baseColors)
  let newHsl: HSL

  switch (relationship) {
    case 'complementary':
      // Exact opposite on color wheel from reference
      newHsl = {
        h: normalizeHue(baseHsl.h + 180),
        s: clamp(baseHsl.s + randomFloat(-15, 15), 25, 90),
        l: clamp(baseHsl.l + randomFloat(-20, 20), 25, 75)
      }
      break

    case 'analogous': {
      // Adjacent colors (±30° from reference)
      const analogousOffset = randomFloat(-30, 30)
      newHsl = {
        h: normalizeHue(baseHsl.h + analogousOffset),
        s: clamp(baseHsl.s + randomFloat(-10, 10), 30, 85),
        l: clamp(baseHsl.l + randomFloat(-15, 15), 30, 70)
      }
      break
    }

    case 'triadic': {
      // Exactly 120° apart from reference
      const triadicOffset = Math.random() > 0.5 ? 120 : 240
      newHsl = {
        h: normalizeHue(baseHsl.h + triadicOffset),
        s: clamp(baseHsl.s + randomFloat(-20, 20), 35, 85),
        l: clamp(baseHsl.l + randomFloat(-25, 25), 25, 75)
      }
      break
    }

    case 'tetradic': {
      // Square: 90° apart from reference
      const tetradicOffsets = [90, 180, 270]
      const tetradicOffset = tetradicOffsets[Math.floor(Math.random() * tetradicOffsets.length)]
      newHsl = {
        h: normalizeHue(baseHsl.h + tetradicOffset),
        s: clamp(baseHsl.s + randomFloat(-15, 15), 30, 80),
        l: clamp(baseHsl.l + randomFloat(-20, 20), 30, 70)
      }
      break
    }

    case 'split-complementary': {
      // Complement ± 30° (150° or 210° from reference)
      const splitOffset = Math.random() > 0.5 ? 150 : 210
      newHsl = {
        h: normalizeHue(baseHsl.h + splitOffset),
        s: clamp(baseHsl.s + randomFloat(-12, 12), 35, 85),
        l: clamp(baseHsl.l + randomFloat(-18, 18), 30, 70)
      }
      break
    }

    case 'monochromatic':
      // Same hue as reference, vary saturation and lightness
      newHsl = {
        h: baseHsl.h,
        s: clamp(baseHsl.s + randomFloat(-40, 40), 15, 95),
        l: clamp(baseHsl.l + randomFloat(-50, 50), 15, 85)
      }
      break

    default:
      return generateRelatedColor(referenceColors, 'random')
  }

  return hslToHex(newHsl)
}

export const COLOR_RELATIONSHIPS: { value: ColorRelationship; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Any random color' },
  { value: 'complementary', label: 'Complementary', description: 'Opposite on color wheel' },
  { value: 'analogous', label: 'Analogous', description: 'Adjacent colors' },
  { value: 'triadic', label: 'Triadic', description: '120° apart' },
  { value: 'tetradic', label: 'Tetradic', description: '90° apart (square)' },
  { value: 'split-complementary', label: 'Split Complementary', description: 'Complement + neighbors' },
  { value: 'monochromatic', label: 'Monochromatic', description: 'Same hue, different saturation/lightness' },
]

export type PalettePreset = {
  id: string
  label: string
  description: string
  hue: [number, number]
  saturation: [number, number]
  lightness: [number, number]
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: 'pastel', label: 'Pastel', description: 'Soft, light tones', hue: [0, 360], saturation: [25, 45], lightness: [75, 88] },
  { id: 'neon', label: 'Neon', description: 'Vivid, electric colors', hue: [0, 360], saturation: [85, 100], lightness: [50, 60] },
  { id: 'earth', label: 'Earth Tones', description: 'Warm, natural hues', hue: [15, 50], saturation: [25, 55], lightness: [35, 55] },
  { id: 'jewel', label: 'Jewel Tones', description: 'Rich, deep saturation', hue: [0, 360], saturation: [55, 80], lightness: [30, 50] },
  { id: 'monochrome', label: 'Monochrome', description: 'Grayscale spread', hue: [0, 0], saturation: [0, 5], lightness: [15, 90] },
  { id: 'warm', label: 'Warm', description: 'Reds, oranges, yellows', hue: [330, 60], saturation: [50, 85], lightness: [45, 70] },
  { id: 'cool', label: 'Cool', description: 'Blues, teals, purples', hue: [180, 280], saturation: [40, 75], lightness: [40, 65] },
  { id: 'muted', label: 'Muted', description: 'Low saturation, subtle', hue: [0, 360], saturation: [10, 30], lightness: [40, 65] },
]

const HSL_TOLERANCE = 2

function isHueInRange(hue: number, [min, max]: [number, number]): boolean {
  if (min === 0 && max === 360) return true
  if (min === 0 && max === 0) return true // monochrome — hue irrelevant
  if (min > max) {
    // Wrapping range (e.g. warm: 330–60)
    return hue >= min - HSL_TOLERANCE || hue <= max + HSL_TOLERANCE
  }
  return hue >= min - HSL_TOLERANCE && hue <= max + HSL_TOLERANCE
}

export function isPresetActive(colors: string[], preset: PalettePreset): boolean {
  if (colors.length === 0) return false
  const isMonochrome = preset.saturation[1] <= 5
  return colors.every(hex => {
    const hsl = hexToHsl(hex)
    if (!isMonochrome && !isHueInRange(hsl.h, preset.hue)) return false
    if (hsl.s < preset.saturation[0] - HSL_TOLERANCE || hsl.s > preset.saturation[1] + HSL_TOLERANCE) return false
    if (hsl.l < preset.lightness[0] - HSL_TOLERANCE || hsl.l > preset.lightness[1] + HSL_TOLERANCE) return false
    return true
  })
}

export function generatePresetPalette(preset: PalettePreset, count = 5): string[] {
  const [hMin, hMax] = preset.hue
  const [sMin, sMax] = preset.saturation
  const [lMin, lMax] = preset.lightness

  const isFullHue = hMin === 0 && hMax === 360
  const isWrapping = hMin > hMax

  // Lightness stratification: divide range into segments for contrast spread
  const lRange = lMax - lMin
  const lSegmentSize = lRange / count
  const lightnessValues = Array.from({ length: count }, (_, i) => {
    const segStart = lMin + i * lSegmentSize
    return randomFloat(segStart, segStart + lSegmentSize)
  })
  // Shuffle lightness values so they aren't in order
  for (let i = lightnessValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lightnessValues[i], lightnessValues[j]] = [lightnessValues[j], lightnessValues[i]]
  }

  // Hue distribution
  const hueValues: number[] = []
  if (isFullHue) {
    // Space hues apart with jitter
    const hueSegment = 360 / count
    const jitter = hueSegment * 0.3
    const offset = randomFloat(0, 360)
    for (let i = 0; i < count; i++) {
      hueValues.push(normalizeHue(offset + i * hueSegment + randomFloat(-jitter, jitter)))
    }
  } else if (isWrapping) {
    // Wrapping range (e.g. warm: 330–60 wraps through 0)
    const effectiveMax = hMax + 360
    for (let i = 0; i < count; i++) {
      hueValues.push(normalizeHue(randomFloat(hMin, effectiveMax)))
    }
  } else {
    // Narrow range
    for (let i = 0; i < count; i++) {
      hueValues.push(randomFloat(hMin, hMax))
    }
  }

  return Array.from({ length: count }, (_, i) => {
    const h = preset.id === 'monochrome' ? 0 : hueValues[i]
    const s = clamp(randomFloat(sMin, sMax), 0, 100)
    const l = clamp(lightnessValues[i], 0, 100)
    return hslToHex({ h: Math.round(h), s: Math.round(s), l: Math.round(l) })
  })
}

export function generateTints(hex: string, count = 9): string[] {
  const { h, s, l } = hexToHsl(hex)
  const target = 97
  return Array.from({ length: count }, (_, i) => {
    const step = (i + 1) / count
    return hslToHex({ h, s, l: clamp(Math.round(l + (target - l) * step), 0, 100) })
  })
}

export function generateShades(hex: string, count = 9): string[] {
  const { h, s, l } = hexToHsl(hex)
  const target = 3
  return Array.from({ length: count }, (_, i) => {
    const step = (i + 1) / count
    return hslToHex({ h, s, l: clamp(Math.round(l + (target - l) * step), 0, 100) })
  })
}

export function generateTones(hex: string, count = 9): string[] {
  const { h, s, l } = hexToHsl(hex)
  const target = 2
  return Array.from({ length: count }, (_, i) => {
    const step = (i + 1) / count
    return hslToHex({ h, s: clamp(Math.round(s + (target - s) * step), 0, 100), l })
  })
}
