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

export type OKLCH = {
  l: number // 0-100 (lightness percentage)
  c: number // 0-0.4 (chroma, typical max ~0.37 for sRGB gamut)
  h: number // 0-360 (hue degrees)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// sRGB linearization (channel value 0-255 → linear 0-1)
export function linearize(value: number): number {
  const v = value / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

/**
 * Fast approximate luminance in raw 0-255 space (not WCAG-linearized).
 * Use for light/dark text heuristics; use relativeLuminance() for WCAG ratios.
 */
export function hexLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// sRGB gamma encoding
function gammaEncode(linear: number): number {
  return linear <= 0.0031308
    ? linear * 12.92
    : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
}

export type Oklab = { L: number; a: number; b: number }

/**
 * Convert hex to Oklab perceptual color space.
 * Pipeline: sRGB → linear RGB → LMS (M1) → cube root → Oklab (M2)
 */
export function hexToOklab(hex: string): Oklab {
  const { r, g, b } = hexToRgb(hex)
  const lr = linearize(r)
  const lg = linearize(g)
  const lb = linearize(b)

  // Linear RGB to LMS (M1 matrix)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  // Cube root for perceptual scaling
  const lc = Math.cbrt(l)
  const mc = Math.cbrt(m)
  const sc = Math.cbrt(s)

  // LMS to Oklab (M2 matrix)
  return {
    L: 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
    a: 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
    b: 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc,
  }
}

export function hexToOklch(hex: string): OKLCH {
  const { L, a, b: okb } = hexToOklab(hex)

  // Oklab to Oklch (cartesian to polar)
  const C = Math.sqrt(a * a + okb * okb)
  const H = C < 0.0001 ? 0 : (Math.atan2(okb, a) * 180) / Math.PI

  return {
    l: L * 100,
    c: C,
    h: ((H % 360) + 360) % 360,
  }
}

export function oklchToHex({ l, c, h }: OKLCH): string {
  const L = l / 100
  const hRad = (h * Math.PI) / 180

  // Oklch to Oklab (polar to cartesian)
  const a = c * Math.cos(hRad)
  const okb = c * Math.sin(hRad)

  // Oklab to LMS (inverse M2 matrix)
  const lc = L + 0.3963377774 * a + 0.2158037573 * okb
  const mc = L - 0.1055613458 * a - 0.0638541728 * okb
  const sc = L - 0.0894841775 * a - 1.2914855480 * okb

  // Cube to get LMS
  const lms_l = lc * lc * lc
  const lms_m = mc * mc * mc
  const lms_s = sc * sc * sc

  // LMS to linear RGB (inverse M1 matrix)
  const lr = +4.0767416621 * lms_l - 3.3077115913 * lms_m + 0.2309699292 * lms_s
  const lg = -1.2684380046 * lms_l + 2.6097574011 * lms_m - 0.3413193965 * lms_s
  const lb = -0.0041960863 * lms_l - 0.7034186147 * lms_m + 1.7076147010 * lms_s

  // Gamma encode and clamp to sRGB
  const r = Math.round(clamp(gammaEncode(lr), 0, 1) * 255)
  const g = Math.round(clamp(gammaEncode(lg), 0, 1) * 255)
  const b = Math.round(clamp(gammaEncode(lb), 0, 1) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
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
  const hNorm = (((h % 360) + 360) % 360) / 360
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

/** Symmetric random offset in [-range, +range]. */
function jitter(range: number): number {
  return randomFloat(-range, range)
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
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
        s: clamp(baseHsl.s + jitter(15), 25, 90),
        l: clamp(baseHsl.l + jitter(20), 25, 75)
      }
      break

    case 'analogous': {
      // Adjacent colors (±30° from reference)
      const analogousOffset = jitter(30)
      newHsl = {
        h: normalizeHue(baseHsl.h + analogousOffset),
        s: clamp(baseHsl.s + jitter(10), 30, 85),
        l: clamp(baseHsl.l + jitter(15), 30, 70)
      }
      break
    }

    case 'triadic': {
      // Exactly 120° apart from reference
      const triadicOffset = Math.random() > 0.5 ? 120 : 240
      newHsl = {
        h: normalizeHue(baseHsl.h + triadicOffset),
        s: clamp(baseHsl.s + jitter(20), 35, 85),
        l: clamp(baseHsl.l + jitter(25), 25, 75)
      }
      break
    }

    case 'tetradic': {
      // Square: 90° apart from reference
      const tetradicOffsets = [90, 180, 270]
      const tetradicOffset = tetradicOffsets[Math.floor(Math.random() * tetradicOffsets.length)]
      newHsl = {
        h: normalizeHue(baseHsl.h + tetradicOffset),
        s: clamp(baseHsl.s + jitter(15), 30, 80),
        l: clamp(baseHsl.l + jitter(20), 30, 70)
      }
      break
    }

    case 'split-complementary': {
      // Complement ± 30° (150° or 210° from reference)
      const splitOffset = Math.random() > 0.5 ? 150 : 210
      newHsl = {
        h: normalizeHue(baseHsl.h + splitOffset),
        s: clamp(baseHsl.s + jitter(12), 35, 85),
        l: clamp(baseHsl.l + jitter(18), 30, 70)
      }
      break
    }

    case 'monochromatic':
      // Same hue as reference, vary saturation and lightness
      newHsl = {
        h: baseHsl.h,
        s: clamp(baseHsl.s + jitter(40), 15, 95),
        l: clamp(baseHsl.l + jitter(50), 15, 85)
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

export const MAX_COLORS = 10
export const BLUEPRINT_COLOR = 'oklch(0.55 0.12 250)'

export function getRowSplit(count: number): [number, number] {
  if (count <= 5) return [count, 0]
  const splits: Record<number, [number, number]> = {
    6: [3, 3], 7: [4, 3], 8: [4, 4], 9: [5, 4], 10: [5, 5],
  }
  return splits[count] ?? [count, 0]
}

/**
 * Returns true whenever there are existing colors that a preset would overwrite.
 * Used to decide whether to show the confirmation dialog before applying a preset.
 * The old (incorrect) condition checked lockedStates.some(Boolean), which silently
 * replaced unlocked palettes without warning.
 */
export function shouldWarnBeforePreset(currentColors: string[]): boolean {
  return currentColors.length > 0
}

/**
 * Returns how many color IDs from the current palette to reuse when applying a preset.
 * Reused IDs stay mounted in-place so only their background-color CSS-transitions.
 * New IDs get enter animations (fade in). IDs beyond the returned count are dropped
 * and their elements exit via AnimatePresence.
 *
 * Strategy: keep the IDs for items that were already in row 1 — they stay mounted and
 * their background-color CSS-transitions smoothly. Items that were in row 2 (or positions
 * that didn't exist yet) get new IDs and fade in at their new positions rather than
 * flying across rows via layoutId animation. For palettes ≤5 all items are in row 1,
 * so getRowSplit already does the right thing universally.
 */
export function getPresetColorIdKeepCount(currentCount: number, newCount: number): number {
  const [oldRow1Count] = getRowSplit(currentCount)
  return Math.min(oldRow1Count, newCount)
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
    const hueJitter = hueSegment * 0.3
    const offset = randomFloat(0, 360)
    for (let i = 0; i < count; i++) {
      hueValues.push(normalizeHue(offset + i * hueSegment + jitter(hueJitter)))
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

// ---------------------------------------------------------------------------
// Color harmony scoring
// ---------------------------------------------------------------------------

export type HarmonyMetrics = {
  hueQuality: number     // 0–100 (high = well-organized hues: tight cluster OR even distribution)
  satConsistency: number // 0–100 (high = consistent saturation)
  lightnessRange: number // 0–100 (high = wide lightness spread)
}

export type HarmonyResult = {
  score: number
  label: string
  detectedRelationship: ColorRelationship | null
  metrics: HarmonyMetrics
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function circularGap(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

// For each K (number of intended evenly-spaced hue positions), find the rotation
// that best matches the actual hues. halfInterval = 90/K degrees — colors within
// that distance of a template position score proportionally. Returns 0–100.
// K=1 rewards tight clusters (mono/analogous); K=2 rewards complementary pairs;
// K=3 rewards triadic; etc. Taking max over all K catches multi-cluster palettes
// (e.g. 4 colors split into two complementary families) that pure variance metrics miss.
function bestFitHueScore(hues: number[]): number {
  const n = hues.length
  let best = 0
  for (let k = 1; k <= n; k++) {
    const halfInterval = 90 / k
    for (const anchor of hues) {
      let total = 0
      for (const h of hues) {
        let minDist = Infinity
        for (let i = 0; i < k; i++) {
          const d = circularGap(h, anchor + (i * 360) / k)
          if (d < minDist) minDist = d
        }
        total += Math.max(0, 1 - minDist / halfInterval)
      }
      const s = (total / n) * 100
      if (s > best) best = s
    }
  }
  return Math.round(best)
}

function detectRelationship(hues: number[]): ColorRelationship | null {
  const n = hues.length
  if (n < 2) return null

  const sorted = [...hues].sort((a, b) => a - b)

  // All gaps for any n
  const allGaps: number[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allGaps.push(circularGap(sorted[i], sorted[j]))
    }
  }

  const TOL = 22 // degrees tolerance

  // Monochromatic: all pairwise gaps < 20°
  if (allGaps.every(g => g < 20)) return 'monochromatic'

  // Analogous: all pairwise gaps < 60° (covers a typical ±30° span)
  if (allGaps.every(g => g < 60)) return 'analogous'

  if (n === 2) {
    if (Math.abs(allGaps[0] - 180) < TOL) return 'complementary'
  }

  if (n === 3) {
    // Consecutive clockwise gaps
    const consec = [
      circularGap(sorted[0], sorted[1]),
      circularGap(sorted[1], sorted[2]),
      circularGap(sorted[2], sorted[0] + 360),
    ]
    // Triadic: all consecutive gaps ≈ 120°
    if (consec.every(g => Math.abs(g - 120) < TOL)) return 'triadic'

    // Split-complementary: one small gap between the two accent colors (<110°),
    // two large equal gaps from the base to each accent (>120° each, ±20° of each other)
    const consecSorted = [...consec].sort((a, b) => a - b)
    const [small, mid, large] = consecSorted
    if (small < 110 && mid > 120 && large > 120 && Math.abs(mid - large) < 40) {
      return 'split-complementary'
    }
  }

  if (n === 4) {
    const consec = [
      circularGap(sorted[0], sorted[1]),
      circularGap(sorted[1], sorted[2]),
      circularGap(sorted[2], sorted[3]),
      circularGap(sorted[3], sorted[0] + 360),
    ]
    if (consec.every(g => Math.abs(g - 90) < TOL)) return 'tetradic'
  }

  return null
}

export function calculateHarmonyScore(colors: string[]): HarmonyResult {
  if (colors.length === 0) {
    return { score: 0, label: '—', detectedRelationship: null, metrics: { hueQuality: 0, satConsistency: 0, lightnessRange: 0 } }
  }
  if (colors.length === 1) {
    return { score: 0, label: '—', detectedRelationship: null, metrics: { hueQuality: 0, satConsistency: 100, lightnessRange: 0 } }
  }

  const hsls = colors.map(hexToHsl)
  const hues = hsls.map(c => c.h)
  const sats = hsls.map(c => c.s)
  const lights = hsls.map(c => c.l)

  // --- Hue quality ---
  const hueQuality = bestFitHueScore(hues)

  // --- Saturation consistency (inverse std dev, S in 0–100) ---
  const mean_s = mean(sats)
  const stdDev_s = Math.sqrt(mean(sats.map(s => (s - mean_s) ** 2)))
  const satConsistency = Math.max(0, Math.round(100 - stdDev_s * 2))

  // --- Lightness range (50-point spread → 100) ---
  const lightnessRange = Math.min(100, Math.round((Math.max(...lights) - Math.min(...lights)) / 50 * 100))

  // --- Relationship detection ---
  const detectedRelationship = detectRelationship(hues)

  // --- Overall score (+ bonus when a named relationship is detected) ---
  // Weights: hue organization matters most; lightness range less so than saturation.
  const rawScore = Math.round(hueQuality * 0.45 + satConsistency * 0.25 + lightnessRange * 0.30)
  const score = detectedRelationship ? Math.min(100, rawScore + 15) : rawScore

  // --- Label ---
  let label: string
  if (detectedRelationship) {
    label = detectedRelationship.replace('-', '\u2011') // non-breaking hyphen
  } else if (lightnessRange > 70) {
    label = 'high contrast'
  } else if (score >= 80) {
    label = 'balanced'
  } else if (score >= 60) {
    label = 'varied'
  } else if (score >= 40) {
    label = 'inconsistent'
  } else {
    label = 'discordant'
  }

  return { score, label, detectedRelationship, metrics: { hueQuality, satConsistency, lightnessRange } }
}
