import { describe, expect, it } from 'vitest'
import { calculateHarmonyScore, hslToHex } from '@/helpers/colorTheory'

function color(h: number, s = 70, l = 50): string {
  return hslToHex({ h, s, l })
}

describe('calculateHarmonyScore', () => {
  it('returns the empty-state result for no colors', () => {
    expect(calculateHarmonyScore([])).toEqual({
      score: 0,
      label: '—',
      detectedRelationship: null,
      metrics: { hueQuality: 0, satConsistency: 0, lightnessRange: 0 },
    })
  })

  it('returns a valid limited result for one color', () => {
    expect(calculateHarmonyScore(['#ff0000'])).toEqual({
      score: 0,
      label: '—',
      detectedRelationship: null,
      metrics: { hueQuality: 0, satConsistency: 100, lightnessRange: 0 },
    })
  })

  it.each([
    ['monochromatic', [color(0), color(8), color(355)]],
    ['analogous', [color(0), color(25), color(48)]],
    ['complementary', [color(0), color(180)]],
    ['triadic', [color(0), color(120), color(240)]],
    ['split-complementary', [color(0), color(150), color(210)]],
    ['tetradic', [color(0), color(90), color(180), color(270)]],
  ] as const)('detects a %s relationship', (relationship, colors) => {
    const result = calculateHarmonyScore([...colors])

    expect(result.detectedRelationship).toBe(relationship)
    expect(result.label.replace('‑', '-')).toBe(relationship)
  })

  it('does not force a relationship onto unrelated hues', () => {
    const result = calculateHarmonyScore([
      color(0),
      color(40),
      color(150),
      color(280),
    ])

    expect(result.detectedRelationship).toBeNull()
  })

  it('scores consistent saturation above a chaotic saturation spread', () => {
    const consistent = calculateHarmonyScore([
      color(0, 60),
      color(120, 60),
      color(240, 60),
    ])
    const chaotic = calculateHarmonyScore([
      color(0, 5),
      color(120, 50),
      color(240, 100),
    ])

    expect(consistent.metrics.satConsistency).toBeGreaterThan(chaotic.metrics.satConsistency)
  })

  it('scores a wide lightness range above clustered mid-tones', () => {
    const wide = calculateHarmonyScore([
      color(0, 60, 10),
      color(120, 60, 50),
      color(240, 60, 90),
    ])
    const clustered = calculateHarmonyScore([
      color(0, 60, 45),
      color(120, 60, 50),
      color(240, 60, 55),
    ])

    expect(wide.metrics.lightnessRange).toBe(100)
    expect(wide.metrics.lightnessRange).toBeGreaterThan(clustered.metrics.lightnessRange)
  })

  it('uses the high-contrast label when no named relationship is detected', () => {
    const result = calculateHarmonyScore([
      color(0, 60, 5),
      color(40, 60, 95),
      color(150, 60, 50),
      color(280, 60, 55),
    ])

    expect(result.detectedRelationship).toBeNull()
    expect(result.label).toBe('high contrast')
  })

  it('always returns bounded finite scores and metrics', () => {
    const palettes = [
      ['#000000', '#ffffff'],
      [color(3, 1, 1), color(179, 99, 99)],
      [color(0), color(17), color(91), color(203), color(359)],
    ]

    for (const palette of palettes) {
      const result = calculateHarmonyScore(palette)
      const values = [result.score, ...Object.values(result.metrics)]

      for (const value of values) {
        expect(Number.isFinite(value)).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      }
    }
  })

  it('is deterministic for the same palette', () => {
    const palette = ['#1f2937', '#f97316', '#f8fafc', '#0ea5e9']

    expect(calculateHarmonyScore(palette)).toEqual(calculateHarmonyScore(palette))
  })
})
