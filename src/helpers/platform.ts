function detectPlatform(): 'mac' | 'other' {
  if ('userAgentData' in navigator) {
    const ua = (navigator as { userAgentData?: { platform?: string } }).userAgentData
    if (ua?.platform?.toLowerCase().includes('mac')) return 'mac'
  }
  if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
    return 'mac'
  }
  return 'other'
}

const PLATFORM = detectPlatform()

const MODIFIER_SYMBOLS = {
  mac:   { shift: '⇧', alt: '⌥' },
  other: { shift: 'Shift', alt: 'Alt' },
} as const

export const isMac = PLATFORM === 'mac'

export function getModifierLabel(modifier: string): string {
  return MODIFIER_SYMBOLS[PLATFORM][modifier as keyof typeof MODIFIER_SYMBOLS['mac']] ?? modifier
}
