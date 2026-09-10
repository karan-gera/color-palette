import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  downloadBlob,
  downloadSvg,
  exportPng,
  exportSvg,
  SIZE_CONFIG,
  type ImageExportOptions,
} from '@/helpers/imageExport'

const COLORS = ['#ffffff', '#111111', '#ff0000']

function options(overrides: Partial<ImageExportOptions> = {}): ImageExportOptions {
  return {
    layout: 'horizontal',
    labels: 'none',
    size: 'small',
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('exportSvg', () => {
  it.each([
    ['small', 800],
    ['medium', 1200],
    ['large', 1920],
  ] as const)('uses the %s width preset', (size, width) => {
    const svg = exportSvg(COLORS, options({ size }))

    expect(SIZE_CONFIG[size].width).toBe(width)
    expect(svg).toContain(`width="${width}"`)
    expect(svg).toContain(`viewBox="0 0 ${width} `)
  })

  it('lays out horizontal colors in equal adjacent blocks', () => {
    const svg = exportSvg(['#ffffff', '#000000'], options())

    expect(svg).toContain('width="800" height="380"')
    expect(svg).toContain('<rect x="40" y="40" width="360" height="300" fill="#ffffff"/>')
    expect(svg).toContain('<rect x="400" y="40" width="360" height="300" fill="#000000"/>')
  })

  it('lays out vertical colors in stacked rows with labels below', () => {
    const svg = exportSvg(
      ['#ffffff', '#000000'],
      options({ layout: 'vertical', labels: 'hex' }),
    )

    expect(svg).toContain('width="480" height="288"')
    expect(svg).toContain('<rect x="40" y="40" width="400" height="80" fill="#ffffff"/>')
    expect(svg).toContain('<rect x="40" y="144" width="400" height="80" fill="#000000"/>')
    expect(svg).toContain('y="138" fill="#ffffff"')
    expect(svg).toContain('>#FFFFFF</text>')
  })

  it('does not leave label gaps between unlabeled vertical rows', () => {
    const svg = exportSvg(
      ['#ffffff', '#000000'],
      options({ layout: 'vertical', labels: 'none' }),
    )

    expect(svg).toContain('width="480" height="240"')
    expect(svg).toContain('<rect x="40" y="120" width="400" height="80" fill="#000000"/>')
  })

  it('places a three-color grid in two rows', () => {
    const svg = exportSvg(COLORS, options({ layout: 'grid', labels: 'hex' }))

    expect(svg).toContain('width="800" height="848"')
    expect(svg).toContain('<rect x="40" y="40" width="355" height="355" fill="#ffffff"/>')
    expect(svg).toContain('<rect x="405" y="40" width="355" height="355" fill="#111111"/>')
    expect(svg).toContain('<rect x="40" y="429" width="355" height="355" fill="#ff0000"/>')
  })

  it('wraps a sixth circle onto a second row', () => {
    const colors = ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555']
    const svg = exportSvg(colors, options({ layout: 'circles', labels: 'none' }))

    expect(svg).toContain('width="800" height="356"')
    expect(svg.match(/<circle /g)).toHaveLength(6)
    expect(svg).toContain('<circle cx="104" cy="104" r="64"')
    expect(svg).toContain('<circle cx="104" cy="252" r="64"')
  })

  it('uses readable text and border colors for light and dark swatches', () => {
    const rects = exportSvg(
      ['#ffffff', '#000000'],
      options({ labels: 'hex' }),
    )
    const circles = exportSvg(
      ['#ffffff', '#000000'],
      options({ layout: 'circles' }),
    )

    expect(rects).toContain('fill="#111111" font-family="monospace"')
    expect(rects).toContain('fill="#ffffff" font-family="monospace"')
    expect(circles).toContain('fill="#ffffff" stroke="#111111"')
    expect(circles).toContain('fill="#000000" stroke="#ffffff"')
  })

  it('uses provided names and escapes them as XML text', () => {
    const svg = exportSvg(
      ['#ff0000'],
      options({ labels: 'name', colorNames: ['red & <warm> "primary"'] }),
    )

    expect(svg).toContain('>red &amp; &lt;warm&gt; &quot;primary&quot;</text>')
    expect(svg).not.toContain('>red & <warm>')
  })

  it('falls back to uppercase hex when a requested color name is missing', () => {
    const svg = exportSvg(['#aabbcc'], options({ labels: 'name', colorNames: [] }))

    expect(svg).toContain('>#AABBCC</text>')
  })
})

describe('exportPng', () => {
  it('draws canvas background, swatches, labels, and circles before returning a PNG blob', async () => {
    const fillRect = vi.fn()
    const fillText = vi.fn()
    const arc = vi.fn()
    const context = {
      fillStyle: '',
      font: '',
      textAlign: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect,
      fillText,
      beginPath: vi.fn(),
      arc,
      fill: vi.fn(),
      setLineDash: vi.fn(),
      stroke: vi.fn(),
    }
    const canvas = document.createElement('canvas')
    const blob = new Blob(['png'], { type: 'image/png' })
    Object.defineProperty(canvas, 'getContext', {
      configurable: true,
      value: vi.fn(() => context),
    })
    Object.defineProperty(canvas, 'toBlob', {
      configurable: true,
      value: vi.fn((callback: BlobCallback) => callback(blob)),
    })
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(tagName => (
      tagName === 'canvas' ? canvas : createElement(tagName)
    ))

    const horizontal = await exportPng(
      ['#ffffff', '#000000'],
      options({ labels: 'hex' }),
    )
    await exportPng(
      ['#ff0000'],
      options({ layout: 'vertical', labels: 'name', colorNames: ['red'] }),
    )
    await exportPng(
      ['#00ff00'],
      options({ layout: 'grid', labels: 'none' }),
    )
    await exportPng(
      ['#0000ff'],
      options({ layout: 'circles', labels: 'hex' }),
    )

    expect(horizontal).toBe(blob)
    expect(fillRect).toHaveBeenCalledWith(0, 0, 800, 404)
    expect(fillText).toHaveBeenCalledWith('#FFFFFF', 220, expect.any(Number))
    expect(fillText).toHaveBeenCalledWith('red', 240, 138)
    expect(arc).toHaveBeenCalledWith(130, 130, 90, 0, Math.PI * 2)
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png')
  })
})

describe('downloads', () => {
  it('downloads a blob and revokes its object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:test')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const link = document.createElement('a')
    const click = vi.spyOn(link, 'click').mockImplementation(() => undefined)
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(tagName => (
      tagName === 'a' ? link : createElement(tagName)
    ))
    const blob = new Blob(['palette'])

    downloadBlob(blob, 'palette.png')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(link.href).toBe('blob:test')
    expect(link.download).toBe('palette.png')
    expect(click).toHaveBeenCalledOnce()
    expect(document.body).not.toContainElement(link)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('wraps SVG text in an SVG blob before downloading', () => {
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob
      return 'blob:svg'
    })
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    const link = document.createElement('a')
    vi.spyOn(link, 'click').mockImplementation(() => undefined)
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(tagName => (
      tagName === 'a' ? link : createElement(tagName)
    ))

    downloadSvg('<svg/>', 'palette.svg')

    const downloaded = createObjectURL.mock.calls[0][0]
    expect(downloaded).toBeInstanceOf(Blob)
    expect(downloaded.type).toBe('image/svg+xml')
    expect(link.download).toBe('palette.svg')
  })
})
