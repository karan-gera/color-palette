import { describe, it, expect } from 'vitest'
import {
  initStopsFromPalette,
  generateLinearGradientCSS,
  generateGradientSVGFile,
  generateGradientTailwind,
  type LinearGradientConfig,
} from '@/helpers/gradientGenerator'

const TWO_COLORS = ['#ff0000', '#0000ff']
const TWO_IDS    = ['id-a', 'id-b']
const THREE_COLORS = ['#ff0000', '#00ff00', '#0000ff']
const THREE_IDS    = ['id-a', 'id-b', 'id-c']
const FIVE_COLORS  = ['#111111', '#333333', '#555555', '#777777', '#999999']
const FIVE_IDS     = ['a', 'b', 'c', 'd', 'e']

// ─── initStopsFromPalette ─────────────────────────────────────────────────────

describe('initStopsFromPalette', () => {
  it('returns empty array for empty palette', () => {
    expect(initStopsFromPalette([], [])).toEqual([])
  })

  it('single color: produces 2 stops at 0% and 100%', () => {
    const stops = initStopsFromPalette(['#aabbcc'], ['id-x'])
    expect(stops).toHaveLength(2)
    expect(stops[0].position).toBe(0)
    expect(stops[1].position).toBe(100)
    expect(stops[0].hex).toBe('#aabbcc')
    expect(stops[1].hex).toBe('#aabbcc')
  })

  it('two colors: first at 0%, last at 100%', () => {
    const stops = initStopsFromPalette(TWO_COLORS, TWO_IDS)
    expect(stops).toHaveLength(2)
    expect(stops[0].position).toBe(0)
    expect(stops[1].position).toBe(100)
    expect(stops[0].hex).toBe('#ff0000')
    expect(stops[1].hex).toBe('#0000ff')
  })

  it('three colors: stops at 0%, 50%, 100%', () => {
    const stops = initStopsFromPalette(THREE_COLORS, THREE_IDS)
    expect(stops).toHaveLength(3)
    expect(stops[0].position).toBe(0)
    expect(stops[1].position).toBe(50)
    expect(stops[2].position).toBe(100)
  })

  it('five colors: evenly distributed positions', () => {
    const stops = initStopsFromPalette(FIVE_COLORS, FIVE_IDS)
    expect(stops).toHaveLength(5)
    expect(stops[0].position).toBe(0)
    expect(stops[1].position).toBe(25)
    expect(stops[2].position).toBe(50)
    expect(stops[3].position).toBe(75)
    expect(stops[4].position).toBe(100)
  })

  it('stops have unique ids', () => {
    const stops = initStopsFromPalette(THREE_COLORS, THREE_IDS)
    const ids = stops.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('stops reference correct palette colorIds', () => {
    const stops = initStopsFromPalette(THREE_COLORS, THREE_IDS)
    expect(stops[0].source).toEqual({ type: 'palette', colorId: 'id-a' })
    expect(stops[1].source).toEqual({ type: 'palette', colorId: 'id-b' })
    expect(stops[2].source).toEqual({ type: 'palette', colorId: 'id-c' })
  })
})

// ─── generateLinearGradientCSS ────────────────────────────────────────────────

function makeConfig(
  colors: string[],
  ids: string[],
  angle = 135,
): LinearGradientConfig {
  return {
    type: 'linear',
    angle,
    stops: initStopsFromPalette(colors, ids),
  }
}

describe('generateLinearGradientCSS', () => {
  it('output matches linear-gradient(...) pattern', () => {
    const css = generateLinearGradientCSS(makeConfig(TWO_COLORS, TWO_IDS))
    expect(css).toMatch(/^linear-gradient\(\d+deg,/)
  })

  it('includes angle in output', () => {
    const css = generateLinearGradientCSS(makeConfig(TWO_COLORS, TWO_IDS, 45))
    expect(css).toContain('45deg')
  })

  it('all palette colors appear in output', () => {
    const css = generateLinearGradientCSS(makeConfig(THREE_COLORS, THREE_IDS))
    expect(css).toContain('#ff0000')
    expect(css).toContain('#00ff00')
    expect(css).toContain('#0000ff')
  })

  it('two-color: contains start and end stops', () => {
    const css = generateLinearGradientCSS(makeConfig(TWO_COLORS, TWO_IDS))
    expect(css).toContain('#ff0000 0%')
    expect(css).toContain('#0000ff 100%')
  })

  it('three-color: middle stop at 50%', () => {
    const css = generateLinearGradientCSS(makeConfig(THREE_COLORS, THREE_IDS))
    expect(css).toContain('#00ff00 50%')
  })

  it('output is directly usable as CSS background value (no extra escaping)', () => {
    const css = generateLinearGradientCSS(makeConfig(TWO_COLORS, TWO_IDS))
    // No newlines, no unmatched parens
    expect(css).not.toContain('\n')
    const opens  = (css.match(/\(/g) ?? []).length
    const closes = (css.match(/\)/g) ?? []).length
    expect(opens).toBe(closes)
  })

  it('stops are sorted by position in output (not insertion order)', () => {
    // Manually create an out-of-order config
    const config: LinearGradientConfig = {
      type: 'linear',
      angle: 90,
      stops: [
        { id: '1', position: 100, hex: '#0000ff', source: { type: 'custom' } },
        { id: '2', position: 0,   hex: '#ff0000', source: { type: 'custom' } },
        { id: '3', position: 50,  hex: '#00ff00', source: { type: 'custom' } },
      ],
    }
    const css = generateLinearGradientCSS(config)
    const redIdx   = css.indexOf('#ff0000')
    const greenIdx = css.indexOf('#00ff00')
    const blueIdx  = css.indexOf('#0000ff')
    expect(redIdx).toBeLessThan(greenIdx)
    expect(greenIdx).toBeLessThan(blueIdx)
  })
})

// ─── generateGradientSVGFile ──────────────────────────────────────────────────

describe('generateGradientSVGFile', () => {
  it('returns a string starting with <svg', () => {
    const svg = generateGradientSVGFile(makeConfig(TWO_COLORS, TWO_IDS))
    expect(svg.trimStart()).toMatch(/^<svg/)
  })

  it('contains a linearGradient element', () => {
    const svg = generateGradientSVGFile(makeConfig(TWO_COLORS, TWO_IDS))
    expect(svg).toContain('<linearGradient')
    expect(svg).toContain('</linearGradient>')
  })

  it('contains a stop element for each color', () => {
    const svg = generateGradientSVGFile(makeConfig(THREE_COLORS, THREE_IDS))
    const matches = svg.match(/<stop /g) ?? []
    expect(matches.length).toBe(3)
  })

  it('all palette colors appear in SVG', () => {
    const svg = generateGradientSVGFile(makeConfig(THREE_COLORS, THREE_IDS))
    expect(svg).toContain('#ff0000')
    expect(svg).toContain('#00ff00')
    expect(svg).toContain('#0000ff')
  })
})

// ─── generateGradientTailwind ─────────────────────────────────────────────────

describe('generateGradientTailwind', () => {
  it('2 stops: produces from and to, no via', () => {
    const result = generateGradientTailwind(makeConfig(TWO_COLORS, TWO_IDS, 90))
    expect(result.css).toContain('from-[')
    expect(result.css).toContain('to-[')
    expect(result.css).not.toContain('via-[')
    expect(result.warning).toBeUndefined()
  })

  it('3 stops: produces from, via, and to', () => {
    const result = generateGradientTailwind(makeConfig(THREE_COLORS, THREE_IDS, 90))
    expect(result.css).toContain('from-[')
    expect(result.css).toContain('via-[')
    expect(result.css).toContain('to-[')
    expect(result.warning).toBeUndefined()
  })

  it('4+ stops: includes a warning', () => {
    const result = generateGradientTailwind(makeConfig(FIVE_COLORS, FIVE_IDS, 90))
    expect(result.warning).toBeDefined()
    expect(result.warning!.length).toBeGreaterThan(0)
  })

  it('angle 90 maps to bg-gradient-to-r', () => {
    const result = generateGradientTailwind(makeConfig(TWO_COLORS, TWO_IDS, 90))
    expect(result.css).toContain('bg-gradient-to-r')
  })

  it('angle 180 maps to bg-gradient-to-b', () => {
    const result = generateGradientTailwind(makeConfig(TWO_COLORS, TWO_IDS, 180))
    expect(result.css).toContain('bg-gradient-to-b')
  })

  it('angle 0 maps to bg-gradient-to-t', () => {
    const result = generateGradientTailwind(makeConfig(TWO_COLORS, TWO_IDS, 0))
    expect(result.css).toContain('bg-gradient-to-t')
  })
})
