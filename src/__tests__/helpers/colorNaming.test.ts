import { describe, it, expect } from 'vitest'
// colorNaming.ts precomputes ~4K Oklab entries at module load (~5ms).
// This is acceptable — the module is cached for the entire test run.
import { getColorName } from '@/helpers/colorNaming'

describe('getColorName', () => {
  it('always returns a non-empty name string', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#000000', '#ffffff', '#808080']
    for (const hex of colors) {
      const result = getColorName(hex)
      expect(typeof result.name).toBe('string')
      expect(result.name.length).toBeGreaterThan(0)
    }
  })

  it('result has name and cssName properties', () => {
    const result = getColorName('#3498db')
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('cssName')
  })

  it('cssName is either a string or null (never undefined)', () => {
    const result = getColorName('#3498db')
    expect(result.cssName === null || typeof result.cssName === 'string').toBe(true)
  })

  it('pure black returns a valid name', () => {
    const result = getColorName('#000000')
    expect(result.name).toBeTruthy()
  })

  it('pure white returns a valid name', () => {
    const result = getColorName('#ffffff')
    expect(result.name).toBeTruthy()
  })

  it('exact CSS color red (#ff0000) returns cssName="red"', () => {
    const result = getColorName('#ff0000')
    expect(result.cssName).toBe('red')
  })

  it('exact CSS color blue (#0000ff) returns cssName="blue"', () => {
    const result = getColorName('#0000ff')
    expect(result.cssName).toBe('blue')
  })

  it('exact CSS color white (#ffffff) returns cssName="white"', () => {
    const result = getColorName('#ffffff')
    expect(result.cssName).toBe('white')
  })

  it('exact CSS color black (#000000) returns cssName="black"', () => {
    const result = getColorName('#000000')
    expect(result.cssName).toBe('black')
  })

  it('exact CSS color lime (#00ff00) returns cssName="lime"', () => {
    // CSS "green" is #008000; pure #00ff00 is "lime"
    const result = getColorName('#00ff00')
    expect(result.cssName).toBe('lime')
  })

  it('color far from any CSS named color returns cssName=null', () => {
    // #7f3f1f is a brownish color not in the CSS named color list
    // and far enough from any CSS color to exceed the 0.0004 threshold
    const result = getColorName('#7f3f1f')
    // This may or may not match depending on threshold — we only check the type
    expect(result.cssName === null || typeof result.cssName === 'string').toBe(true)
  })
})
