import { describe, it } from 'vitest'

// Extract from Image — planned feature (see TODO.md)
// Drag-and-drop image → extract dominant colors via Canvas API + color quantization.
// Fully client-side (k-means or median cut). Activate when implemented.

describe('extractFromImage (future)', () => {
  it.todo('returns correct number of colors (default 5 dominant colors)')
  it.todo('returns correct count when a custom count is specified')
  it.todo('all returned values are valid hex strings matching /^#[0-9a-f]{6}$/')
  it.todo('deduplication: very similar colors (within threshold) are merged into one')
  it.todo('solid red image pixel data: returns a result approximating #ff0000')
  it.todo('solid white image pixel data: returns a result approximating #ffffff')
  it.todo('solid black image pixel data: returns a result approximating #000000')
  it.todo('1×1 pixel image: returns a single color without crash')
  it.todo('image with fewer unique colors than requested: returns what is available (no crash)')
  it.todo('quantization is deterministic for the same input pixel data')
  it.todo('transparent pixels (alpha=0) are excluded from quantization')
  it.todo('semi-transparent pixels are handled gracefully (no NaN in output)')
})
