import { describe, it, expect, afterEach, vi } from 'vitest'

// platform.ts runs detectPlatform() at module load time and stores the result
// in a const PLATFORM. To test both branches, we must stub navigator BEFORE
// importing and use vi.resetModules() to evict the cached module between groups.

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('getModifierLabel - mac platform (navigator.platform)', () => {
  it('returns ⇧ for shift', async () => {
    vi.stubGlobal('navigator', { userAgentData: undefined, platform: 'MacIntel' })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('shift')).toBe('⇧')
  })

  it('returns ⌥ for alt', async () => {
    vi.stubGlobal('navigator', { userAgentData: undefined, platform: 'MacIntel' })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('alt')).toBe('⌥')
  })
})

describe('getModifierLabel - non-mac platform (navigator.platform)', () => {
  it('returns Shift for shift', async () => {
    vi.stubGlobal('navigator', { userAgentData: undefined, platform: 'Win32' })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('shift')).toBe('Shift')
  })

  it('returns Alt for alt', async () => {
    vi.stubGlobal('navigator', { userAgentData: undefined, platform: 'Win32' })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('alt')).toBe('Alt')
  })
})

describe('getModifierLabel - unknown modifier passthrough', () => {
  it('returns the input string unchanged for unknown modifiers', async () => {
    vi.stubGlobal('navigator', { userAgentData: undefined, platform: 'Win32' })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('ctrl')).toBe('ctrl')
    expect(getModifierLabel('meta')).toBe('meta')
  })
})

describe('getModifierLabel - userAgentData branch takes priority', () => {
  it('detects mac via userAgentData.platform even if navigator.platform says otherwise', async () => {
    vi.stubGlobal('navigator', {
      userAgentData: { platform: 'macOS' },
      platform: 'Win32', // contradictory — userAgentData should win
    })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('shift')).toBe('⇧')
  })

  it('falls through to navigator.platform when userAgentData does not include "mac"', async () => {
    // The implementation only explicitly returns 'mac' from the userAgentData branch.
    // If userAgentData.platform does not contain 'mac', it falls through to the
    // navigator.platform check. Both must be non-mac to detect 'other'.
    vi.stubGlobal('navigator', {
      userAgentData: { platform: 'Windows' },
      platform: 'Win32',
    })
    const { getModifierLabel } = await import('@/helpers/platform')
    expect(getModifierLabel('shift')).toBe('Shift')
  })
})
