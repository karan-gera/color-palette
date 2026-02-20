import { describe, it, expect } from 'vitest'
import { relativeLuminance, contrastRatio, wcagLevel, describeContrast } from '@/helpers/contrast'

describe('relativeLuminance', () => {
  it('black has luminance 0', () => {
    expect(relativeLuminance('#000000')).toBe(0)
  })
  it('white has luminance 1', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })
  it('luminance is always between 0 and 1', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#808080', '#3498db']
    for (const c of colors) {
      const l = relativeLuminance(c)
      expect(l).toBeGreaterThanOrEqual(0)
      expect(l).toBeLessThanOrEqual(1)
    }
  })
  it('green has higher luminance than red (human perception coefficients)', () => {
    // Green coefficient is 0.7152, red is 0.2126 — green contributes most to brightness
    expect(relativeLuminance('#00ff00')).toBeGreaterThan(relativeLuminance('#ff0000'))
  })
  it('mid-gray (#808080) has luminance approximately 0.216', () => {
    // 128/255 ≈ 0.502 sRGB → linearized → ~0.216
    expect(relativeLuminance('#808080')).toBeCloseTo(0.216, 2)
  })
})

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })
  it('white on black is 21:1 (symmetric)', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0)
  })
  it('identical colors have ratio 1', () => {
    expect(contrastRatio('#3498db', '#3498db')).toBeCloseTo(1, 5)
  })
  it('ratio is always >= 1', () => {
    const pairs: [string, string][] = [
      ['#ff0000', '#0000ff'],
      ['#ffffff', '#808080'],
      ['#3498db', '#e74c3c'],
    ]
    for (const [a, b] of pairs) {
      expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(1)
    }
  })
  it('ratio is symmetric (order of arguments does not matter)', () => {
    const r1 = contrastRatio('#3498db', '#e74c3c')
    const r2 = contrastRatio('#e74c3c', '#3498db')
    expect(r1).toBeCloseTo(r2, 10)
  })
})

describe('wcagLevel', () => {
  it('returns aaa for ratio >= 7', () => {
    expect(wcagLevel(7)).toBe('aaa')
    expect(wcagLevel(21)).toBe('aaa')
  })
  it('returns aa for ratio >= 4.5 and < 7', () => {
    expect(wcagLevel(4.5)).toBe('aa')
    expect(wcagLevel(6.9)).toBe('aa')
  })
  it('returns aa18 for ratio >= 3 and < 4.5', () => {
    expect(wcagLevel(3)).toBe('aa18')
    expect(wcagLevel(4.4)).toBe('aa18')
  })
  it('returns fail for ratio < 3', () => {
    expect(wcagLevel(1)).toBe('fail')
    expect(wcagLevel(2.9)).toBe('fail')
  })
  it('boundary 7 is aaa not aa', () => {
    expect(wcagLevel(7)).toBe('aaa')
  })
  it('boundary 4.5 is aa not aa18', () => {
    expect(wcagLevel(4.5)).toBe('aa')
  })
  it('boundary 3 is aa18 not fail', () => {
    expect(wcagLevel(3)).toBe('aa18')
  })
})

describe('describeContrast', () => {
  it('all excellent returns summary phrase', () => {
    const results = [
      { bg: 'light', level: 'aaa' as const },
      { bg: 'gray', level: 'aaa' as const },
      { bg: 'dark', level: 'aaa' as const },
    ]
    expect(describeContrast(results)).toBe('excellent readability on all backgrounds')
  })

  it('all insufficient returns warning phrase', () => {
    const results = [
      { bg: 'light', level: 'fail' as const },
      { bg: 'gray', level: 'fail' as const },
      { bg: 'dark', level: 'fail' as const },
    ]
    const output = describeContrast(results)
    expect(output).toContain('insufficient contrast on all backgrounds')
  })

  it('mixed results join with middot separator', () => {
    const results = [
      { bg: 'light', level: 'aaa' as const },
      { bg: 'dark', level: 'fail' as const },
    ]
    const output = describeContrast(results)
    expect(output).toContain('excellent on light')
    expect(output).toContain('not suitable on dark')
    expect(output).toContain('·')
  })

  it('two-item joinList uses "and" not comma', () => {
    const results = [
      { bg: 'light', level: 'aaa' as const },
      { bg: 'gray', level: 'aaa' as const },
      { bg: 'dark', level: 'fail' as const },
    ]
    const output = describeContrast(results)
    expect(output).toContain('light and gray')
  })

  it('aa18 level appears as "large text only"', () => {
    const results = [{ bg: 'gray', level: 'aa18' as const }]
    expect(describeContrast(results)).toContain('large text only')
  })

  it('aa level appears as "readable"', () => {
    const results = [{ bg: 'light', level: 'aa' as const }]
    expect(describeContrast(results)).toContain('readable')
  })
})
