/**
 * Export format utilities for generating palette in various formats
 */

export type ExportFormat = 
  | 'css'
  | 'json'
  | 'tailwind'
  | 'scss'
  | 'ase'
  | 'aco'
  | 'gpl'
  | 'procreate'
  | 'paintnet'

export type ExportCategory = 'code' | 'art'

export type ExportFormatInfo = {
  value: ExportFormat
  label: string
  description: string
  extension: string
  mimeType: string
  isDownload: boolean
  category: ExportCategory
  compatibleApps: string[] // App IDs that support this format
}

export type AppId = 
  | 'photoshop'
  | 'illustrator'
  | 'procreate'
  | 'clipstudio'
  | 'gimp'
  | 'krita'
  | 'paintnet'

export type AppInfo = {
  id: AppId
  name: string
  preferredFormat: ExportFormat
  importSteps: string[]
}

export const APP_INFO: AppInfo[] = [
  {
    id: 'photoshop',
    name: 'Photoshop / Illustrator',
    preferredFormat: 'ase',
    importSteps: [
      'Download the .ase file',
      'Open Swatches panel (Window > Swatches)',
      'Click menu > Import Swatches (or Open Swatch Library > Other Library)',
      'Select your .ase file',
    ],
  },
  {
    id: 'procreate',
    name: 'Procreate',
    preferredFormat: 'procreate',
    importSteps: [
      'Save the .swatches file to Files app',
      'In Procreate, tap Colors > Palettes > + > New from file',
      'Select your .swatches file',
    ],
  },
  {
    id: 'clipstudio',
    name: 'Clip Studio Paint',
    preferredFormat: 'ase',
    importSteps: [
      'Download the .ase file',
      'Window > Color Set > Import color set',
      'Select your .ase file',
    ],
  },
  {
    id: 'gimp',
    name: 'GIMP',
    preferredFormat: 'gpl',
    importSteps: [
      'Download the .gpl file',
      'Place in ~/.config/GIMP/palettes/ (or Windows equivalent)',
      'Restart GIMP',
      'Find palette in Windows > Dockable Dialogs > Palettes',
    ],
  },
  {
    id: 'krita',
    name: 'Krita',
    preferredFormat: 'gpl',
    importSteps: [
      'Download the .gpl file',
      'Go to Settings > Manage Resources > Open Resource Folder',
      'Place file in palettes/ folder',
      'Restart Krita',
    ],
  },
  {
    id: 'paintnet',
    name: 'Paint.NET',
    preferredFormat: 'paintnet',
    importSteps: [
      'Download the .txt file',
      'Place in Documents/Paint.NET User Files/Palettes/',
      'Restart Paint.NET',
    ],
  },
]

export const EXPORT_FORMATS: ExportFormatInfo[] = [
  // Code formats
  { 
    value: 'css', 
    label: 'CSS Variables', 
    description: ':root { --color-1: ... }', 
    extension: 'css', 
    mimeType: 'text/css', 
    isDownload: false,
    category: 'code',
    compatibleApps: [],
  },
  { 
    value: 'json', 
    label: 'JSON', 
    description: '{ "colors": [...] }', 
    extension: 'json', 
    mimeType: 'application/json', 
    isDownload: false,
    category: 'code',
    compatibleApps: [],
  },
  { 
    value: 'tailwind', 
    label: 'Tailwind Config', 
    description: 'colors: { ... }', 
    extension: 'js', 
    mimeType: 'text/javascript', 
    isDownload: false,
    category: 'code',
    compatibleApps: [],
  },
  { 
    value: 'scss', 
    label: 'SCSS Variables', 
    description: '$color-1: ...', 
    extension: 'scss', 
    mimeType: 'text/x-scss', 
    isDownload: false,
    category: 'code',
    compatibleApps: [],
  },
  // Art app formats
  { 
    value: 'ase', 
    label: 'Adobe ASE', 
    description: 'Adobe Swatch Exchange', 
    extension: 'ase', 
    mimeType: 'application/octet-stream', 
    isDownload: true,
    category: 'art',
    compatibleApps: ['photoshop', 'illustrator', 'procreate', 'clipstudio'],
  },
  { 
    value: 'aco', 
    label: 'Adobe ACO', 
    description: 'Photoshop Color Swatches', 
    extension: 'aco', 
    mimeType: 'application/octet-stream', 
    isDownload: true,
    category: 'art',
    compatibleApps: ['photoshop', 'clipstudio'],
  },
  { 
    value: 'procreate', 
    label: 'Procreate Swatches', 
    description: '.swatches file', 
    extension: 'swatches', 
    mimeType: 'application/octet-stream', 
    isDownload: true,
    category: 'art',
    compatibleApps: ['procreate'],
  },
  { 
    value: 'gpl', 
    label: 'GIMP Palette', 
    description: '.gpl palette file', 
    extension: 'gpl', 
    mimeType: 'text/plain', 
    isDownload: true,
    category: 'art',
    compatibleApps: ['gimp', 'krita'],
  },
  { 
    value: 'paintnet', 
    label: 'Paint.NET Palette', 
    description: '.txt palette file', 
    extension: 'txt', 
    mimeType: 'text/plain', 
    isDownload: true,
    category: 'art',
    compatibleApps: ['paintnet'],
  },
]

// Helper functions
export const CODE_FORMATS = EXPORT_FORMATS.filter(f => f.category === 'code')
export const ART_FORMATS = EXPORT_FORMATS.filter(f => f.category === 'art')

/**
 * Generate CSS variables format
 */
function exportCss(colors: string[]): string {
  const vars = colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')
  return `:root {\n${vars}\n}`
}

/**
 * Generate JSON format
 */
function exportJson(colors: string[]): string {
  return JSON.stringify({ colors }, null, 2)
}

/**
 * Generate Tailwind config format
 */
function exportTailwind(colors: string[]): string {
  const colorObj = colors.reduce((acc, c, i) => {
    acc[`color-${i + 1}`] = c
    return acc
  }, {} as Record<string, string>)
  
  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorObj, null, 8).replace(/"/g, "'")}
    }
  }
}`
}

/**
 * Generate SCSS variables format
 */
function exportScss(colors: string[]): string {
  return colors.map((c, i) => `$color-${i + 1}: ${c};`).join('\n')
}

/**
 * Generate GIMP Palette format
 */
function exportGpl(colors: string[]): string {
  const header = 'GIMP Palette\nName: Color Palette Export\nColumns: 0\n#'
  const colorLines = colors.map(c => {
    const hex = c.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `${r.toString().padStart(3)} ${g.toString().padStart(3)} ${b.toString().padStart(3)}\t${c}`
  }).join('\n')
  return `${header}\n${colorLines}`
}

/**
 * Generate Paint.NET palette format
 * Simple text file with AARRGGBB hex values, one per line
 * AA = alpha (FF = opaque), RR = red, GG = green, BB = blue
 */
function exportPaintNet(colors: string[]): string {
  // Paint.NET format: AARRGGBB hex values, one per line
  // Lines starting with ; are comments
  const header = '; Paint.NET Palette\n; Exported from Color Palette'
  const colorLines = colors.map(c => {
    const hex = c.replace('#', '').toUpperCase()
    return `FF${hex}` // FF = fully opaque
  }).join('\n')
  return `${header}\n${colorLines}`
}

/**
 * Generate Procreate .swatches format
 * This is a ZIP file containing a JSON payload
 */
async function exportProcreate(colors: string[]): Promise<Blob> {
  // Procreate .swatches format is a ZIP containing:
  // - Swatches.json with color data in HSB format
  
  const swatches = colors.map(c => {
    const hex = c.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    
    // Convert RGB to HSB
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    
    let h = 0
    if (d !== 0) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      else if (max === g) h = ((b - r) / d + 2) / 6
      else h = ((r - g) / d + 4) / 6
    }
    const s = max === 0 ? 0 : d / max
    const v = max
    
    return {
      hue: h,
      saturation: s,
      brightness: v,
      alpha: 1,
      colorSpace: 0
    }
  })
  
  const json = JSON.stringify([
    {
      name: 'Color Palette Export',
      swatches: swatches
    }
  ])
  
  // Create a simple ZIP file manually (minimal ZIP structure)
  // ZIP files have a specific structure we need to follow
  const filename = 'Swatches.json'
  const content = new TextEncoder().encode(json)
  
  // Build ZIP file
  const zip = buildSimpleZip(filename, content)
  return new Blob([zip], { type: 'application/zip' })
}

/**
 * Build a minimal ZIP file with a single uncompressed file
 */
function buildSimpleZip(filename: string, content: Uint8Array): Uint8Array {
  const filenameBytes = new TextEncoder().encode(filename)
  const now = new Date()
  
  // DOS date/time format
  const dosTime = (now.getSeconds() >> 1) | (now.getMinutes() << 5) | (now.getHours() << 11)
  const dosDate = now.getDate() | ((now.getMonth() + 1) << 5) | ((now.getFullYear() - 1980) << 9)
  
  // CRC32 calculation
  const crc = crc32(content)
  
  // Local file header (30 bytes + filename)
  const localHeader = new Uint8Array(30 + filenameBytes.length)
  const localView = new DataView(localHeader.buffer)
  localView.setUint32(0, 0x04034b50, true)  // Local file header signature
  localView.setUint16(4, 20, true)           // Version needed
  localView.setUint16(6, 0, true)            // General purpose flag
  localView.setUint16(8, 0, true)            // Compression method (0 = store)
  localView.setUint16(10, dosTime, true)     // Last mod time
  localView.setUint16(12, dosDate, true)     // Last mod date
  localView.setUint32(14, crc, true)         // CRC-32
  localView.setUint32(18, content.length, true) // Compressed size
  localView.setUint32(22, content.length, true) // Uncompressed size
  localView.setUint16(26, filenameBytes.length, true) // Filename length
  localView.setUint16(28, 0, true)           // Extra field length
  localHeader.set(filenameBytes, 30)
  
  // Central directory header (46 bytes + filename)
  const centralHeader = new Uint8Array(46 + filenameBytes.length)
  const centralView = new DataView(centralHeader.buffer)
  centralView.setUint32(0, 0x02014b50, true) // Central directory signature
  centralView.setUint16(4, 20, true)          // Version made by
  centralView.setUint16(6, 20, true)          // Version needed
  centralView.setUint16(8, 0, true)           // General purpose flag
  centralView.setUint16(10, 0, true)          // Compression method
  centralView.setUint16(12, dosTime, true)    // Last mod time
  centralView.setUint16(14, dosDate, true)    // Last mod date
  centralView.setUint32(16, crc, true)        // CRC-32
  centralView.setUint32(20, content.length, true) // Compressed size
  centralView.setUint32(24, content.length, true) // Uncompressed size
  centralView.setUint16(28, filenameBytes.length, true) // Filename length
  centralView.setUint16(30, 0, true)          // Extra field length
  centralView.setUint16(32, 0, true)          // Comment length
  centralView.setUint16(34, 0, true)          // Disk number start
  centralView.setUint16(36, 0, true)          // Internal file attributes
  centralView.setUint32(38, 0, true)          // External file attributes
  centralView.setUint32(42, 0, true)          // Relative offset of local header
  centralHeader.set(filenameBytes, 46)
  
  const centralDirOffset = localHeader.length + content.length
  
  // End of central directory (22 bytes)
  const endOfCentral = new Uint8Array(22)
  const endView = new DataView(endOfCentral.buffer)
  endView.setUint32(0, 0x06054b50, true)     // End of central directory signature
  endView.setUint16(4, 0, true)               // Disk number
  endView.setUint16(6, 0, true)               // Disk number with central directory
  endView.setUint16(8, 1, true)               // Total entries on this disk
  endView.setUint16(10, 1, true)              // Total entries
  endView.setUint32(12, centralHeader.length, true) // Central directory size
  endView.setUint32(16, centralDirOffset, true)     // Central directory offset
  endView.setUint16(20, 0, true)              // Comment length
  
  // Combine all parts
  const totalLength = localHeader.length + content.length + centralHeader.length + endOfCentral.length
  const result = new Uint8Array(totalLength)
  let offset = 0
  result.set(localHeader, offset); offset += localHeader.length
  result.set(content, offset); offset += content.length
  result.set(centralHeader, offset); offset += centralHeader.length
  result.set(endOfCentral, offset)
  
  return result
}

/**
 * CRC32 calculation for ZIP files
 */
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  const table = getCrc32Table()
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF]
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0
}

let crc32Table: Uint32Array | null = null
function getCrc32Table(): Uint32Array {
  if (crc32Table) return crc32Table
  
  crc32Table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crc32Table[i] = c
  }
  return crc32Table
}

/**
 * Generate Adobe ACO (Photoshop Color Swatches) format
 * Version 2 format with color names
 */
function exportAco(colors: string[]): Blob {
  // ACO format: version 1 section + version 2 section
  // Version 2 includes color names
  
  const colorCount = colors.length
  
  // Calculate sizes
  // Version 1: 2 (version) + 2 (count) + count * 10 (color entries)
  // Version 2: 2 (version) + 2 (count) + count * (10 + 4 + name_length * 2)
  
  const v1Size = 4 + colorCount * 10
  let v2Size = 4
  const names = colors.map((_, i) => `Color ${i + 1}`)
  names.forEach(name => {
    v2Size += 10 + 4 + (name.length + 1) * 2 // +1 for null terminator
  })
  
  const totalSize = v1Size + v2Size
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  
  let offset = 0
  
  // Version 1 section
  view.setUint16(offset, 1, false); offset += 2  // Version 1
  view.setUint16(offset, colorCount, false); offset += 2  // Number of colors
  
  colors.forEach(c => {
    const hex = c.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    
    view.setUint16(offset, 0, false); offset += 2  // Color space: RGB
    view.setUint16(offset, r * 257, false); offset += 2  // Red (0-65535)
    view.setUint16(offset, g * 257, false); offset += 2  // Green
    view.setUint16(offset, b * 257, false); offset += 2  // Blue
    view.setUint16(offset, 0, false); offset += 2  // Fourth component (unused for RGB)
  })
  
  // Version 2 section
  view.setUint16(offset, 2, false); offset += 2  // Version 2
  view.setUint16(offset, colorCount, false); offset += 2  // Number of colors
  
  colors.forEach((c, i) => {
    const hex = c.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const name = names[i]
    
    view.setUint16(offset, 0, false); offset += 2  // Color space: RGB
    view.setUint16(offset, r * 257, false); offset += 2  // Red
    view.setUint16(offset, g * 257, false); offset += 2  // Green
    view.setUint16(offset, b * 257, false); offset += 2  // Blue
    view.setUint16(offset, 0, false); offset += 2  // Fourth component
    view.setUint32(offset, name.length + 1, false); offset += 4  // Name length (including null)
    
    // Write name as UTF-16BE with null terminator
    for (let j = 0; j < name.length; j++) {
      view.setUint16(offset, name.charCodeAt(j), false); offset += 2
    }
    view.setUint16(offset, 0, false); offset += 2  // Null terminator
  })
  
  return new Blob([buffer], { type: 'application/octet-stream' })
}

/**
 * Generate Adobe ASE (Adobe Swatch Exchange) format
 * ASE is a binary format, returns a Blob
 */
function exportAse(colors: string[]): Blob {
  // ASE file structure:
  // - 4 bytes: signature "ASEF"
  // - 2 bytes: version (1.0)
  // - 4 bytes: number of blocks
  // - blocks...

  const encoder = new TextEncoder()
  const blocks: Uint8Array[] = []
  
  // Each color block
  colors.forEach((color, index) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    
    const name = `Color ${index + 1}`
    const nameUtf16 = new Uint8Array(name.length * 2 + 2)
    for (let i = 0; i < name.length; i++) {
      nameUtf16[i * 2] = 0
      nameUtf16[i * 2 + 1] = name.charCodeAt(i)
    }
    nameUtf16[name.length * 2] = 0
    nameUtf16[name.length * 2 + 1] = 0
    
    // Block: type (2) + length (4) + name length (2) + name + colorspace (4) + RGB (12) + type (2)
    const blockLength = 2 + nameUtf16.length + 4 + 12 + 2
    const block = new ArrayBuffer(2 + 4 + blockLength)
    const view = new DataView(block)
    
    let offset = 0
    // Block type: 0x0001 = color entry
    view.setUint16(offset, 0x0001); offset += 2
    // Block length
    view.setUint32(offset, blockLength); offset += 4
    // Name length (in UTF-16 chars including null terminator)
    view.setUint16(offset, name.length + 1); offset += 2
    // Name
    new Uint8Array(block, offset, nameUtf16.length).set(nameUtf16); offset += nameUtf16.length
    // Color space: "RGB "
    new Uint8Array(block, offset, 4).set(encoder.encode('RGB ')); offset += 4
    // RGB values as floats
    view.setFloat32(offset, r); offset += 4
    view.setFloat32(offset, g); offset += 4
    view.setFloat32(offset, b); offset += 4
    // Color type: 0 = global
    view.setUint16(offset, 0)
    
    blocks.push(new Uint8Array(block))
  })
  
  // Calculate total size
  const totalBlockSize = blocks.reduce((sum, b) => sum + b.length, 0)
  const fileSize = 4 + 2 + 2 + 4 + totalBlockSize // signature + version + numBlocks + blocks
  const file = new ArrayBuffer(fileSize)
  const fileView = new DataView(file)
  
  let offset = 0
  // Signature: "ASEF"
  new Uint8Array(file, offset, 4).set(encoder.encode('ASEF')); offset += 4
  // Version: 1.0
  fileView.setUint16(offset, 1); offset += 2
  fileView.setUint16(offset, 0); offset += 2
  // Number of blocks
  fileView.setUint32(offset, colors.length); offset += 4
  // Blocks
  blocks.forEach(block => {
    new Uint8Array(file, offset, block.length).set(block)
    offset += block.length
  })
  
  return new Blob([file], { type: 'application/octet-stream' })
}

/**
 * Export palette in the specified format
 * Returns string for text formats, Blob for binary formats
 * Some formats (like Procreate) are async
 */
export async function exportPalette(colors: string[], format: ExportFormat): Promise<string | Blob> {
  switch (format) {
    case 'css':
      return exportCss(colors)
    case 'json':
      return exportJson(colors)
    case 'tailwind':
      return exportTailwind(colors)
    case 'scss':
      return exportScss(colors)
    case 'gpl':
      return exportGpl(colors)
    case 'ase':
      return exportAse(colors)
    case 'aco':
      return exportAco(colors)
    case 'procreate':
      return exportProcreate(colors)
    case 'paintnet':
      return exportPaintNet(colors)
    default:
      return exportJson(colors)
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Download content as file
 */
export function downloadFile(content: string | Blob, filename: string): void {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: 'text/plain' })
    : content
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
