import { describe, it } from 'vitest'

// Gradient Generator — planned feature (see TODO.md)
// Will generate CSS gradient strings from palette colors.
// Activate these tests when the feature is implemented.

describe('gradientGenerator (future)', () => {
  it.todo('generateLinearGradient: output matches CSS linear-gradient(...) pattern')
  it.todo('generateLinearGradient: default angle produces a valid gradient string')
  it.todo('generateLinearGradient: custom angle is included in output string')
  it.todo('generateLinearGradient: negative angle normalizes correctly (e.g. -90 → 270)')
  it.todo('generateLinearGradient: angle > 360 normalizes correctly (e.g. 450 → 90)')
  it.todo('generateLinearGradient: all palette colors appear in output in order')
  it.todo('generateLinearGradient: single-color produces valid CSS with one stop')
  it.todo('generateLinearGradient: two-color produces start and end stops')
  it.todo('generateRadialGradient: output matches CSS radial-gradient(...) pattern')
  it.todo('generateRadialGradient: all palette colors appear in output')
  it.todo('generateConicGradient: output matches CSS conic-gradient(...) pattern')
  it.todo('generateConicGradient: all palette colors appear in output')
  it.todo('all generators return strings (not Blobs or other types)')
  it.todo('output CSS is directly usable in a style attribute (no extra escaping needed)')
})
