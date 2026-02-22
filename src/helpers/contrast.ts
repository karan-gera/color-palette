import { hexToRgb, linearize } from '@/helpers/colorTheory'

export type WCAGLevel = 'aaa' | 'aa' | 'aa18' | 'fail'

/**
 * WCAG 2.1 relative luminance from hex color.
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/**
 * Contrast ratio between two hex colors (WCAG 2.1).
 * Returns a value >= 1, e.g. 4.5
 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1)
  const l2 = relativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Determine WCAG compliance level from contrast ratio.
 * AAA: 7:1+, AA: 4.5:1+, AA18 (large text): 3:1+, fail: below 3:1
 */
export function wcagLevel(ratio: number): WCAGLevel {
  if (ratio >= 7) return 'aaa'
  if (ratio >= 4.5) return 'aa'
  if (ratio >= 3) return 'aa18'
  return 'fail'
}

/**
 * Theme background hex values (approximate sRGB equivalents of the OKLCH
 * values defined in index.css).
 */
export const THEME_BACKGROUNDS: { label: string; hex: string }[] = [
  { label: 'light', hex: '#f5f5f5' },
  { label: 'gray', hex: '#777777' },
  { label: 'dark', hex: '#1a1a1a' },
]

type BackgroundResult = {
  bg: string
  level: WCAGLevel
}

/**
 * Build a natural-language summary of a color's contrast across backgrounds.
 * Groups backgrounds by quality and composes a sentence.
 */
export function describeContrast(results: BackgroundResult[]): string {
  const excellent: string[] = []
  const readable: string[] = []
  const largeOnly: string[] = []
  const insufficient: string[] = []

  for (const { bg, level } of results) {
    if (level === 'aaa') excellent.push(bg)
    else if (level === 'aa') readable.push(bg)
    else if (level === 'aa18') largeOnly.push(bg)
    else insufficient.push(bg)
  }

  // Check for uniform results across all backgrounds
  if (excellent.length === results.length) {
    return 'excellent readability on all backgrounds'
  }
  if (insufficient.length === results.length) {
    return 'insufficient contrast on all backgrounds \u2014 consider adjusting'
  }

  const parts: string[] = []

  if (excellent.length > 0) {
    parts.push(`excellent on ${joinList(excellent)}`)
  }
  if (readable.length > 0) {
    parts.push(`readable on ${joinList(readable)}`)
  }
  if (largeOnly.length > 0) {
    parts.push(`large text only on ${joinList(largeOnly)}`)
  }
  if (insufficient.length > 0) {
    parts.push(`not suitable on ${joinList(insufficient)}`)
  }

  return parts.join(' \u00b7 ')
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
