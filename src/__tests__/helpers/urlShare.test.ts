import { describe, it, expect, afterEach, vi } from 'vitest'

// window.location must be stubbed BEFORE importing urlShare because the functions
// read window.location at call time. We use dynamic imports after stubbing.
// vi.resetModules() in afterEach evicts the module cache between tests.

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

function setupLocation(url: string) {
  const parsed = new URL(url)
  vi.stubGlobal('location', {
    origin: parsed.origin,
    pathname: parsed.pathname,
    search: parsed.search,
    href: url,
  })
  vi.stubGlobal('history', {
    replaceState: vi.fn(),
  })
}

describe('encodePaletteToUrl', () => {
  it('empty colors returns origin+pathname only', async () => {
    setupLocation('https://example.com/')
    const { encodePaletteToUrl } = await import('@/helpers/urlShare')
    const result = encodePaletteToUrl([], [])
    expect(result).toBe('https://example.com/')
  })

  it('strips # from colors in query string', async () => {
    setupLocation('https://example.com/')
    const { encodePaletteToUrl } = await import('@/helpers/urlShare')
    const result = encodePaletteToUrl(['#ff5733', '#3498db'], [false, false])
    expect(result).toContain('ff5733')
    expect(result).toContain('3498db')
    expect(result).not.toMatch(/#[0-9a-f]{6}/)
  })

  it('omits locked param when all are unlocked', async () => {
    setupLocation('https://example.com/')
    const { encodePaletteToUrl } = await import('@/helpers/urlShare')
    const result = encodePaletteToUrl(['#ff5733'], [false])
    expect(result).not.toContain('locked')
  })

  it('includes locked param when any color is locked', async () => {
    setupLocation('https://example.com/')
    const { encodePaletteToUrl } = await import('@/helpers/urlShare')
    const result = encodePaletteToUrl(['#ff5733', '#3498db'], [true, false])
    expect(result).toContain('locked')
  })

  it('produces a URL containing colors param', async () => {
    setupLocation('https://example.com/')
    const { encodePaletteToUrl } = await import('@/helpers/urlShare')
    const result = encodePaletteToUrl(['#aabbcc'], [false])
    expect(result).toContain('colors=')
  })
})

describe('decodePaletteFromUrl', () => {
  it('returns null when no colors param', async () => {
    setupLocation('https://example.com/')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    expect(decodePaletteFromUrl()).toBeNull()
  })

  it('parses valid colors from URL and adds # prefix', async () => {
    setupLocation('https://example.com/?colors=ff5733,3498db')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result).not.toBeNull()
    expect(result!.colors).toEqual(['#ff5733', '#3498db'])
  })

  it('lowercases hex values', async () => {
    setupLocation('https://example.com/?colors=FF5733')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result!.colors[0]).toBe('#ff5733')
  })

  it('filters out invalid hex values', async () => {
    setupLocation('https://example.com/?colors=ff5733,NOTVALID,3498db')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result!.colors).toHaveLength(2)
  })

  it('returns null when all colors are invalid', async () => {
    setupLocation('https://example.com/?colors=INVALID,ALSOBAD')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    expect(decodePaletteFromUrl()).toBeNull()
  })

  it('defaults all lockedStates to true when locked param absent', async () => {
    setupLocation('https://example.com/?colors=ff5733,3498db')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result!.lockedStates).toEqual([true, true])
  })

  it('parses locked param as booleans (1=true, 0=false)', async () => {
    setupLocation('https://example.com/?colors=ff5733,3498db&locked=1,0')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result!.lockedStates).toEqual([true, false])
  })

  it('pads lockedStates with true when shorter than colors', async () => {
    setupLocation('https://example.com/?colors=ff5733,3498db,00ff00&locked=0')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result!.lockedStates).toHaveLength(3)
    expect(result!.lockedStates[1]).toBe(true)
    expect(result!.lockedStates[2]).toBe(true)
  })

  it('trims lockedStates when longer than colors', async () => {
    setupLocation('https://example.com/?colors=ff5733&locked=1,0,1,0')
    const { decodePaletteFromUrl } = await import('@/helpers/urlShare')
    const result = decodePaletteFromUrl()
    expect(result!.lockedStates).toHaveLength(1)
  })
})

describe('clearUrlParams', () => {
  it('calls history.replaceState to remove color params', async () => {
    const mockReplaceState = vi.fn()
    setupLocation('https://example.com/?colors=ff5733&locked=1')
    vi.stubGlobal('history', { replaceState: mockReplaceState })

    const { clearUrlParams } = await import('@/helpers/urlShare')
    clearUrlParams()

    expect(mockReplaceState).toHaveBeenCalledOnce()
    const newUrl = mockReplaceState.mock.calls[0][2] as string
    expect(newUrl).not.toContain('colors')
    expect(newUrl).not.toContain('locked')
  })
})
