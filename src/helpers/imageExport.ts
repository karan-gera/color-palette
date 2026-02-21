/**
 * Image export utilities for generating palette images (PNG/SVG)
 */

export type ImageLayout = 'horizontal' | 'vertical' | 'grid' | 'circles'
export type ImageLabels = 'none' | 'hex' | 'name'
export type ImageSize = 'small' | 'medium' | 'large'

export type ImageExportOptions = {
  layout: ImageLayout
  labels: ImageLabels
  size: ImageSize
  colorNames?: string[]
}

const SIZE_CONFIG: Record<ImageSize, { width: number; label: string }> = {
  small: { width: 800, label: '800px' },
  medium: { width: 1200, label: '1200px' },
  large: { width: 1920, label: '1920px' },
}

const PADDING = 40
const LABEL_HEIGHT = 24
const LABEL_FONT_SIZE = 14
const CIRCLE_GAP = 20

function hexLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function getTextColor(bgHex: string): string {
  return hexLuminance(bgHex) > 160 ? '#111111' : '#ffffff'
}

/**
 * Calculate dimensions based on layout and color count
 */
function calculateDimensions(
  colors: string[],
  layout: ImageLayout,
  baseWidth: number,
  hasLabels: boolean
): { width: number; height: number; itemWidth: number; itemHeight: number; cols: number; rows: number } {
  const count = colors.length
  const labelSpace = hasLabels ? LABEL_HEIGHT : 0
  const contentWidth = baseWidth - PADDING * 2

  switch (layout) {
    case 'horizontal': {
      const itemWidth = Math.floor(contentWidth / count)
      const itemHeight = Math.min(itemWidth * 1.5, 300)
      return {
        width: baseWidth,
        height: itemHeight + labelSpace + PADDING * 2,
        itemWidth,
        itemHeight,
        cols: count,
        rows: 1,
      }
    }
    case 'vertical': {
      const itemWidth = Math.min(contentWidth, 400)
      const itemHeight = 80
      return {
        width: itemWidth + PADDING * 2,
        height: count * itemHeight + labelSpace * count + PADDING * 2,
        itemWidth,
        itemHeight,
        cols: 1,
        rows: count,
      }
    }
    case 'grid': {
      const cols = Math.ceil(Math.sqrt(count))
      const rows = Math.ceil(count / cols)
      const itemWidth = Math.floor((contentWidth - (cols - 1) * 10) / cols)
      const itemHeight = itemWidth
      // Always reserve label space for consistent layout
      return {
        width: baseWidth,
        height: rows * (itemHeight + LABEL_HEIGHT) + (rows - 1) * 10 + PADDING * 2,
        itemWidth,
        itemHeight,
        cols,
        rows,
      }
    }
    case 'circles': {
      const cols = Math.min(count, 5)
      const rows = Math.ceil(count / cols)
      const maxCircleSize = Math.floor((contentWidth - (cols - 1) * CIRCLE_GAP) / cols)
      const circleSize = Math.min(maxCircleSize, 180)
      const itemWidth = circleSize
      const itemHeight = circleSize
      return {
        width: cols * (circleSize + CIRCLE_GAP) - CIRCLE_GAP + PADDING * 2,
        height: rows * (circleSize + labelSpace + CIRCLE_GAP) - CIRCLE_GAP + PADDING * 2,
        itemWidth,
        itemHeight,
        cols,
        rows,
      }
    }
  }
}

/**
 * Export palette as PNG using Canvas API
 */
export async function exportPng(
  colors: string[],
  options: ImageExportOptions
): Promise<Blob> {
  const { layout, labels, size, colorNames } = options
  const baseWidth = SIZE_CONFIG[size].width
  const hasLabels = labels !== 'none'

  const dims = calculateDimensions(colors, layout, baseWidth, hasLabels)
  
  const canvas = document.createElement('canvas')
  canvas.width = dims.width
  canvas.height = dims.height
  const ctx = canvas.getContext('2d')!
  
  // Background
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, dims.width, dims.height)

  // Draw colors
  colors.forEach((color, i) => {
    const { x, y } = getItemPosition(i, layout, dims)
    const label = labels === 'hex' ? color.toUpperCase() : (colorNames?.[i] || color.toUpperCase())
    
    if (layout === 'circles') {
      drawCircle(ctx, x, y, dims.itemWidth, color, hasLabels ? label : null)
    } else {
      drawRect(ctx, x, y, dims.itemWidth, dims.itemHeight, color, hasLabels ? label : null, layout === 'vertical')
    }
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

function getItemPosition(
  index: number,
  layout: ImageLayout,
  dims: { itemWidth: number; itemHeight: number; cols: number }
): { x: number; y: number } {
  const labelSpace = LABEL_HEIGHT

  switch (layout) {
    case 'horizontal':
      return {
        x: PADDING + index * dims.itemWidth,
        y: PADDING,
      }
    case 'vertical':
      return {
        x: PADDING,
        y: PADDING + index * (dims.itemHeight + labelSpace),
      }
    case 'grid': {
      const col = index % dims.cols
      const row = Math.floor(index / dims.cols)
      return {
        x: PADDING + col * (dims.itemWidth + 10),
        y: PADDING + row * (dims.itemHeight + labelSpace + 10),
      }
    }
    case 'circles': {
      const col = index % dims.cols
      const row = Math.floor(index / dims.cols)
      return {
        x: PADDING + col * (dims.itemWidth + CIRCLE_GAP),
        y: PADDING + row * (dims.itemHeight + labelSpace + CIRCLE_GAP),
      }
    }
  }
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  label: string | null,
  labelBelow: boolean = false
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, width, height)

  if (label) {
    ctx.font = `${LABEL_FONT_SIZE}px monospace`
    ctx.textAlign = 'center'
    
    if (labelBelow) {
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, x + width / 2, y + height + LABEL_HEIGHT - 6)
    } else {
      ctx.fillStyle = getTextColor(color)
      ctx.fillText(label, x + width / 2, y + height / 2 + LABEL_FONT_SIZE / 3)
    }
  }
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  diameter: number,
  color: string,
  label: string | null
): void {
  const radius = diameter / 2
  const centerX = x + radius
  const centerY = y + radius

  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // Dashed border
  ctx.strokeStyle = getTextColor(color)
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.stroke()
  ctx.setLineDash([])

  if (label) {
    ctx.font = `${LABEL_FONT_SIZE}px monospace`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, centerX, y + diameter + LABEL_HEIGHT - 4)
  }
}

/**
 * Export palette as SVG string
 */
export function exportSvg(
  colors: string[],
  options: ImageExportOptions
): string {
  const { layout, labels, size, colorNames } = options
  const baseWidth = SIZE_CONFIG[size].width
  const hasLabels = labels !== 'none'

  const dims = calculateDimensions(colors, layout, baseWidth, hasLabels)

  const elements: string[] = []

  colors.forEach((color, i) => {
    const { x, y } = getItemPosition(i, layout, dims)
    const label = labels === 'hex' ? color.toUpperCase() : (colorNames?.[i] || color.toUpperCase())
    
    if (layout === 'circles') {
      elements.push(svgCircle(x, y, dims.itemWidth, color, hasLabels ? label : null))
    } else {
      elements.push(svgRect(x, y, dims.itemWidth, dims.itemHeight, color, hasLabels ? label : null, layout === 'vertical'))
    }
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dims.width}" height="${dims.height}" viewBox="0 0 ${dims.width} ${dims.height}">
  <rect width="100%" height="100%" fill="#1a1a1a"/>
  ${elements.join('\n  ')}
</svg>`
}

function svgRect(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  label: string | null,
  labelBelow: boolean = false
): string {
  const textColor = labelBelow ? '#ffffff' : getTextColor(color)
  const textX = x + width / 2
  const textY = labelBelow ? y + height + LABEL_HEIGHT - 6 : y + height / 2 + LABEL_FONT_SIZE / 3

  let svg = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}"/>`
  
  if (label) {
    svg += `\n  <text x="${textX}" y="${textY}" fill="${textColor}" font-family="monospace" font-size="${LABEL_FONT_SIZE}" text-anchor="middle">${escapeXml(label)}</text>`
  }

  return svg
}

function svgCircle(
  x: number,
  y: number,
  diameter: number,
  color: string,
  label: string | null
): string {
  const radius = diameter / 2
  const centerX = x + radius
  const centerY = y + radius
  const textColor = getTextColor(color)

  let svg = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" stroke="${textColor}" stroke-width="2" stroke-dasharray="6,4"/>`
  
  if (label) {
    svg += `\n  <text x="${centerX}" y="${y + diameter + LABEL_HEIGHT - 4}" fill="#ffffff" font-family="monospace" font-size="${LABEL_FONT_SIZE}" text-anchor="middle">${escapeXml(label)}</text>`
  }

  return svg
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download SVG string as file
 */
export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  downloadBlob(blob, filename)
}

export { SIZE_CONFIG }
