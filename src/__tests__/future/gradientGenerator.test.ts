import { describe, it } from 'vitest'

// Gradient Generator — future gradient types (see TODO.md)
// Linear gradient is implemented and tested in src/__tests__/helpers/gradientGenerator.test.ts
// Activate these tests when radial/conic types are added.

describe('gradientGenerator — future types', () => {
  it.todo('generateRadialGradient: output matches CSS radial-gradient(...) pattern')
  it.todo('generateRadialGradient: all palette colors appear in output')
  it.todo('generateConicGradient: output matches CSS conic-gradient(...) pattern')
  it.todo('generateConicGradient: all palette colors appear in output')
})
