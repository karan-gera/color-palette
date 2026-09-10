import { describe, expect, it } from 'vitest'
import { quantizeImagePixels } from '@/helpers/extractFromImage'

type Rgba = [number, number, number, number]

function pixels(...values: Rgba[]): Uint8ClampedArray {
  return new Uint8ClampedArray(values.flat())
}

const DISTINCT_COLORS: Rgba[] = [
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [255, 255, 0, 255],
  [255, 0, 255, 255],
  [0, 255, 255, 255],
  [255, 255, 255, 255],
  [0, 0, 0, 255],
  [128, 64, 32, 255],
  [32, 64, 128, 255],
  [64, 128, 32, 255],
]

describe('quantizeImagePixels', () => {
  it('returns the default 10 colors when enough distinct colors are available', () => {
    expect(quantizeImagePixels(pixels(...DISTINCT_COLORS))).toHaveLength(10)
  })

  it('returns the requested number of colors', () => {
    expect(quantizeImagePixels(pixels(...DISTINCT_COLORS), 4)).toHaveLength(4)
  })

  it('returns lowercase six-digit hex colors', () => {
    const result = quantizeImagePixels(pixels(...DISTINCT_COLORS), 4)

    for (const color of result) expect(color).toMatch(/^#[0-9a-f]{6}$/)
  })

  it.each([
    { name: 'red', rgba: [255, 0, 0, 255] as Rgba, expected: '#ff0000' },
    { name: 'white', rgba: [255, 255, 255, 255] as Rgba, expected: '#ffffff' },
    { name: 'black', rgba: [0, 0, 0, 255] as Rgba, expected: '#000000' },
  ])('extracts a solid $name image exactly', ({ rgba, expected }) => {
    expect(quantizeImagePixels(pixels(rgba), 10)).toEqual([expected])
  })

  it('handles a one-pixel image without crashing', () => {
    expect(quantizeImagePixels(pixels([12, 34, 56, 255]), 10)).toEqual(['#0c2238'])
  })

  it('caps the result at the distinct-color count and removes duplicate centroids', () => {
    const repeated = pixels(
      [255, 0, 0, 255],
      [255, 0, 0, 255],
      [0, 0, 255, 255],
      [0, 0, 255, 255],
    )

    const result = quantizeImagePixels(repeated, 10)

    expect(result).toHaveLength(2)
    expect(new Set(result).size).toBe(result.length)
    expect(result).toEqual(expect.arrayContaining(['#ff0000', '#0000ff']))
  })

  it('is deterministic for the same pixel data', () => {
    const input = pixels(...DISTINCT_COLORS, ...DISTINCT_COLORS.slice().reverse())

    expect(quantizeImagePixels(input, 5)).toEqual(quantizeImagePixels(input, 5))
  })

  it('excludes fully transparent pixels from quantization', () => {
    const input = pixels(
      [0, 255, 0, 0],
      [0, 0, 255, 0],
      [255, 0, 0, 255],
    )

    expect(quantizeImagePixels(input, 10)).toEqual(['#ff0000'])
  })

  it('handles semi-transparent pixels without producing invalid output', () => {
    const result = quantizeImagePixels(pixels([12, 34, 56, 200]), 1)

    expect(result).toEqual(['#0c2238'])
  })

  it('excludes pixels at the alpha cutoff and includes pixels above it', () => {
    const input = pixels(
      [255, 0, 0, 128],
      [0, 0, 255, 129],
    )

    expect(quantizeImagePixels(input, 2)).toEqual(['#0000ff'])
  })

  it('returns an empty palette when every pixel is transparent', () => {
    expect(quantizeImagePixels(pixels([1, 2, 3, 0]), 5)).toEqual([])
  })

  it('ignores invalid pixels and clamps valid channels into the rgb range', () => {
    const input = [
      Number.NaN, 0, 0, 255,
      300, -5, 12, 255,
    ]

    expect(quantizeImagePixels(input, 5)).toEqual(['#ff000c'])
  })

  it('orders clusters by the number of source pixels they represent', () => {
    const input = pixels(
      [0, 0, 255, 255],
      [255, 0, 0, 255],
      [255, 0, 0, 255],
      [255, 0, 0, 255],
    )

    expect(quantizeImagePixels(input, 2)).toEqual(['#ff0000', '#0000ff'])
  })

  it.each([
    { name: 'empty data', input: new Uint8ClampedArray(), count: 5 },
    { name: 'incomplete rgba data', input: new Uint8ClampedArray([255, 0, 0]), count: 5 },
    { name: 'zero colors', input: pixels([255, 0, 0, 255]), count: 0 },
    { name: 'negative colors', input: pixels([255, 0, 0, 255]), count: -1 },
    { name: 'less than one color', input: pixels([255, 0, 0, 255]), count: 0.5 },
    { name: 'non-finite colors', input: pixels([255, 0, 0, 255]), count: Number.NaN },
  ])('returns an empty palette for $name', ({ input, count }) => {
    expect(quantizeImagePixels(input, count)).toEqual([])
  })
})
