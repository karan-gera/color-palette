import { describe, it, expect } from 'vitest'
import { shouldScrollOnExpand, SCROLL_DELAY_MS } from '@/helpers/scroll'

describe('shouldScrollOnExpand', () => {
  it('returns true when panel is expanding', () => {
    expect(shouldScrollOnExpand(true)).toBe(true)
  })

  it('returns false when panel is collapsing', () => {
    expect(shouldScrollOnExpand(false)).toBe(false)
  })
})

describe('SCROLL_DELAY_MS', () => {
  it('is a positive number allowing animation to start before scroll', () => {
    expect(SCROLL_DELAY_MS).toBeGreaterThan(0)
    expect(SCROLL_DELAY_MS).toBeLessThanOrEqual(500)
  })
})
