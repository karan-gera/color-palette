// ─── Types ────────────────────────────────────────────────────────────────────

export type GradientStop = {
  id: string
  position: number // 0–100
  hex: string      // resolved color (always current)
  source:
    | { type: 'palette'; colorId: string }
    | { type: 'custom' }
}

export type LinearGradientConfig = {
  type: 'linear'
  angle: number // 0–360 degrees
  stops: GradientStop[]
}

// Union for future radial/conic types
export type GradientConfig = LinearGradientConfig

// ─── Initialization ───────────────────────────────────────────────────────────

export function initStopsFromPalette(
  colors: string[],
  colorIds: string[],
): GradientStop[] {
  if (colors.length === 0) return []

  if (colors.length === 1) {
    return [
      {
        id: crypto.randomUUID(),
        position: 0,
        hex: colors[0],
        source: { type: 'palette', colorId: colorIds[0] },
      },
      {
        id: crypto.randomUUID(),
        position: 100,
        hex: colors[0],
        source: { type: 'palette', colorId: colorIds[0] },
      },
    ]
  }

  return colors.map((hex, i) => ({
    id: crypto.randomUUID(),
    position: Math.round((i / (colors.length - 1)) * 100),
    hex,
    source: { type: 'palette', colorId: colorIds[i] },
  }))
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function sortedStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.position - b.position)
}

// Convert CSS angle (clockwise from "to top") to SVG x1/y1/x2/y2 percentages
function angleToSVGCoords(angle: number): {
  x1: number
  y1: number
  x2: number
  y2: number
} {
  const rad = (angle * Math.PI) / 180
  const toX = Math.sin(rad)
  const toY = -Math.cos(rad)
  return {
    x1: 50 - 50 * toX,
    y1: 50 - 50 * toY,
    x2: 50 + 50 * toX,
    y2: 50 + 50 * toY,
  }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

export function generateLinearGradientCSS(config: LinearGradientConfig): string {
  const stopList = sortedStops(config.stops)
    .map(s => `${s.hex} ${s.position}%`)
    .join(', ')
  return `linear-gradient(${config.angle}deg, ${stopList})`
}

// ─── SVG ─────────────────────────────────────────────────────────────────────

function exportDimensions(aspectRatio: number): { width: number; height: number } {
  const MAX_DIM = 1920
  const h = Math.round(MAX_DIM / aspectRatio)
  if (h <= MAX_DIM) return { width: MAX_DIM, height: h }
  // Portrait: clamp height to MAX_DIM, compute width
  return { width: Math.round(MAX_DIM * aspectRatio), height: MAX_DIM }
}

export function generateGradientSVGFile(
  config: LinearGradientConfig,
  aspectRatio = 16 / 9,
): string {
  const { x1, y1, x2, y2 } = angleToSVGCoords(config.angle)
  const stops = sortedStops(config.stops)
  const { width, height } = exportDimensions(aspectRatio)
  const stopElements = stops
    .map(s => `    <stop offset="${s.position}%" stop-color="${s.hex}"/>`)
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="grad" x1="${x1.toFixed(2)}%" y1="${y1.toFixed(2)}%" x2="${x2.toFixed(2)}%" y2="${y2.toFixed(2)}%">
${stopElements}
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
</svg>`
}

// ─── PNG strip ───────────────────────────────────────────────────────────────

export async function generateGradientPNGStrip(
  config: LinearGradientConfig,
  aspectRatio = 16 / 9,
): Promise<Blob> {
  const { width, height } = exportDimensions(aspectRatio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const cx = width / 2
  const cy = height / 2
  const diagonal = Math.sqrt(width * width + height * height) / 2
  const rad = (config.angle * Math.PI) / 180

  const grad = ctx.createLinearGradient(
    cx - Math.sin(rad) * diagonal,
    cy + Math.cos(rad) * diagonal,
    cx + Math.sin(rad) * diagonal,
    cy - Math.cos(rad) * diagonal,
  )

  for (const stop of sortedStops(config.stops)) {
    grad.addColorStop(stop.position / 100, stop.hex)
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
    )
  })
}

// ─── Tailwind ────────────────────────────────────────────────────────────────

const TAILWIND_DIRECTIONS: Array<[min: number, max: number, cls: string]> = [
  [0, 22, 'to-t'],
  [23, 67, 'to-tr'],
  [68, 112, 'to-r'],
  [113, 157, 'to-br'],
  [158, 202, 'to-b'],
  [203, 247, 'to-bl'],
  [248, 292, 'to-l'],
  [293, 337, 'to-tl'],
  [338, 360, 'to-t'],
]

function angleToTailwindDirection(angle: number): string {
  const a = ((angle % 360) + 360) % 360
  for (const [min, max, cls] of TAILWIND_DIRECTIONS) {
    if (a >= min && a <= max) return cls
  }
  return 'to-r'
}

export type TailwindGradientResult = {
  css: string
  warning?: string
}

export function generateGradientTailwind(
  config: LinearGradientConfig,
): TailwindGradientResult {
  const stops = sortedStops(config.stops)
  const dir = angleToTailwindDirection(config.angle)

  if (stops.length === 2) {
    return {
      css: `bg-gradient-${dir} from-[${stops[0].hex}] to-[${stops[stops.length - 1].hex}]`,
    }
  }

  if (stops.length === 3) {
    return {
      css: `bg-gradient-${dir} from-[${stops[0].hex}] via-[${stops[1].hex}] to-[${stops[2].hex}]`,
    }
  }

  // >3 stops: use first, middle, last with a warning
  const mid = stops[Math.floor(stops.length / 2)]
  return {
    css: `bg-gradient-${dir} from-[${stops[0].hex}] via-[${mid.hex}] to-[${stops[stops.length - 1].hex}]`,
    warning: `tailwind only supports 3 color stops (from/via/to). showing stops 1, ${Math.floor(stops.length / 2) + 1}, and ${stops.length} of ${stops.length}.`,
  }
}
