/**
 * URL sharing utilities for palette encoding/decoding
 * Format: ?colors=ff5733,3498db,2ecc71&locked=1,0,1
 */

export type SharedPalette = {
  colors: string[]
  lockedStates: boolean[]
}

/**
 * Encode palette to URL search params
 */
export function encodePaletteToUrl(colors: string[], lockedStates: boolean[]): string {
  if (colors.length === 0) return window.location.origin + window.location.pathname

  const params = new URLSearchParams()
  
  // Strip # from colors and join with commas
  const colorString = colors.map(c => c.replace('#', '')).join(',')
  params.set('colors', colorString)
  
  // Only include locked states if any are locked
  if (lockedStates.some(Boolean)) {
    const lockedString = lockedStates.map(l => l ? '1' : '0').join(',')
    params.set('locked', lockedString)
  }

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}

/**
 * Decode palette from current URL
 * Returns null if no valid palette in URL
 */
export function decodePaletteFromUrl(): SharedPalette | null {
  const params = new URLSearchParams(window.location.search)
  const colorString = params.get('colors')
  
  if (!colorString) return null

  // Parse colors (add # prefix back)
  const colors = colorString.split(',')
    .map(c => c.trim())
    .filter(c => /^[0-9a-fA-F]{6}$/.test(c))
    .map(c => `#${c.toLowerCase()}`)

  if (colors.length === 0) return null

  // Parse locked states (default to all locked when loading from URL)
  const lockedString = params.get('locked')
  let lockedStates: boolean[]
  
  if (lockedString) {
    lockedStates = lockedString.split(',').map(l => l === '1')
    // Pad or trim to match colors length
    while (lockedStates.length < colors.length) lockedStates.push(true)
    lockedStates = lockedStates.slice(0, colors.length)
  } else {
    // Default: all colors locked when loading from shared URL
    lockedStates = new Array(colors.length).fill(true)
  }

  return { colors, lockedStates }
}

/**
 * Clear palette params from URL without reload
 */
export function clearUrlParams(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('colors')
  url.searchParams.delete('locked')
  window.history.replaceState({}, '', url.pathname)
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrl(colors: string[], lockedStates: boolean[]): Promise<boolean> {
  const url = encodePaletteToUrl(colors, lockedStates)
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch (err) {
    console.error('Failed to copy URL:', err)
    return false
  }
}
