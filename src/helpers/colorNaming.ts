import { hexToRgb, linearize } from '@/helpers/colorTheory'
import { colornames } from 'color-name-list/bestof'

type Oklab = { L: number; a: number; b: number }

/**
 * Convert hex color to Oklab perceptual color space.
 * Pipeline: sRGB → linear RGB → LMS (M1) → cube root → Oklab (M2)
 */
function hexToOklab(hex: string): Oklab {
  const { r, g, b } = hexToRgb(hex)
  const lr = linearize(r)
  const lg = linearize(g)
  const lb = linearize(b)

  // sRGB to LMS via M1 matrix
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb

  // Cube root
  const lc = Math.cbrt(l)
  const mc = Math.cbrt(m)
  const sc = Math.cbrt(s)

  // LMS to Oklab via M2 matrix
  return {
    L: 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc,
    a: 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc,
    b: 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc,
  }
}

/**
 * Squared Euclidean distance in Oklab space (skip sqrt for perf).
 */
function oklabDistanceSq(a: Oklab, b: Oklab): number {
  const dL = a.L - b.L
  const da = a.a - b.a
  const db = a.b - b.b
  return dL * dL + da * da + db * db
}

// Pre-compute Oklab values for the ~4K best-of color names at module load
const colorDb = colornames.map((entry) => ({
  name: entry.name,
  hex: entry.hex,
  lab: hexToOklab(entry.hex),
}))

// CSS named colors (148 entries) for optional annotation
const CSS_NAMED_COLORS: { name: string; hex: string }[] = [
  { name: 'aliceblue', hex: '#f0f8ff' },
  { name: 'antiquewhite', hex: '#faebd7' },
  { name: 'aqua', hex: '#00ffff' },
  { name: 'aquamarine', hex: '#7fffd4' },
  { name: 'azure', hex: '#f0ffff' },
  { name: 'beige', hex: '#f5f5dc' },
  { name: 'bisque', hex: '#ffe4c4' },
  { name: 'black', hex: '#000000' },
  { name: 'blanchedalmond', hex: '#ffebcd' },
  { name: 'blue', hex: '#0000ff' },
  { name: 'blueviolet', hex: '#8a2be2' },
  { name: 'brown', hex: '#a52a2a' },
  { name: 'burlywood', hex: '#deb887' },
  { name: 'cadetblue', hex: '#5f9ea0' },
  { name: 'chartreuse', hex: '#7fff00' },
  { name: 'chocolate', hex: '#d2691e' },
  { name: 'coral', hex: '#ff7f50' },
  { name: 'cornflowerblue', hex: '#6495ed' },
  { name: 'cornsilk', hex: '#fff8dc' },
  { name: 'crimson', hex: '#dc143c' },
  { name: 'cyan', hex: '#00ffff' },
  { name: 'darkblue', hex: '#00008b' },
  { name: 'darkcyan', hex: '#008b8b' },
  { name: 'darkgoldenrod', hex: '#b8860b' },
  { name: 'darkgray', hex: '#a9a9a9' },
  { name: 'darkgreen', hex: '#006400' },
  { name: 'darkkhaki', hex: '#bdb76b' },
  { name: 'darkmagenta', hex: '#8b008b' },
  { name: 'darkolivegreen', hex: '#556b2f' },
  { name: 'darkorange', hex: '#ff8c00' },
  { name: 'darkorchid', hex: '#9932cc' },
  { name: 'darkred', hex: '#8b0000' },
  { name: 'darksalmon', hex: '#e9967a' },
  { name: 'darkseagreen', hex: '#8fbc8f' },
  { name: 'darkslateblue', hex: '#483d8b' },
  { name: 'darkslategray', hex: '#2f4f4f' },
  { name: 'darkturquoise', hex: '#00ced1' },
  { name: 'darkviolet', hex: '#9400d3' },
  { name: 'deeppink', hex: '#ff1493' },
  { name: 'deepskyblue', hex: '#00bfff' },
  { name: 'dimgray', hex: '#696969' },
  { name: 'dodgerblue', hex: '#1e90ff' },
  { name: 'firebrick', hex: '#b22222' },
  { name: 'floralwhite', hex: '#fffaf0' },
  { name: 'forestgreen', hex: '#228b22' },
  { name: 'fuchsia', hex: '#ff00ff' },
  { name: 'gainsboro', hex: '#dcdcdc' },
  { name: 'ghostwhite', hex: '#f8f8ff' },
  { name: 'gold', hex: '#ffd700' },
  { name: 'goldenrod', hex: '#daa520' },
  { name: 'gray', hex: '#808080' },
  { name: 'green', hex: '#008000' },
  { name: 'greenyellow', hex: '#adff2f' },
  { name: 'honeydew', hex: '#f0fff0' },
  { name: 'hotpink', hex: '#ff69b4' },
  { name: 'indianred', hex: '#cd5c5c' },
  { name: 'indigo', hex: '#4b0082' },
  { name: 'ivory', hex: '#fffff0' },
  { name: 'khaki', hex: '#f0e68c' },
  { name: 'lavender', hex: '#e6e6fa' },
  { name: 'lavenderblush', hex: '#fff0f5' },
  { name: 'lawngreen', hex: '#7cfc00' },
  { name: 'lemonchiffon', hex: '#fffacd' },
  { name: 'lightblue', hex: '#add8e6' },
  { name: 'lightcoral', hex: '#f08080' },
  { name: 'lightcyan', hex: '#e0ffff' },
  { name: 'lightgoldenrodyellow', hex: '#fafad2' },
  { name: 'lightgray', hex: '#d3d3d3' },
  { name: 'lightgreen', hex: '#90ee90' },
  { name: 'lightpink', hex: '#ffb6c1' },
  { name: 'lightsalmon', hex: '#ffa07a' },
  { name: 'lightseagreen', hex: '#20b2aa' },
  { name: 'lightskyblue', hex: '#87cefa' },
  { name: 'lightslategray', hex: '#778899' },
  { name: 'lightsteelblue', hex: '#b0c4de' },
  { name: 'lightyellow', hex: '#ffffe0' },
  { name: 'lime', hex: '#00ff00' },
  { name: 'limegreen', hex: '#32cd32' },
  { name: 'linen', hex: '#faf0e6' },
  { name: 'magenta', hex: '#ff00ff' },
  { name: 'maroon', hex: '#800000' },
  { name: 'mediumaquamarine', hex: '#66cdaa' },
  { name: 'mediumblue', hex: '#0000cd' },
  { name: 'mediumorchid', hex: '#ba55d3' },
  { name: 'mediumpurple', hex: '#9370db' },
  { name: 'mediumseagreen', hex: '#3cb371' },
  { name: 'mediumslateblue', hex: '#7b68ee' },
  { name: 'mediumspringgreen', hex: '#00fa9a' },
  { name: 'mediumturquoise', hex: '#48d1cc' },
  { name: 'mediumvioletred', hex: '#c71585' },
  { name: 'midnightblue', hex: '#191970' },
  { name: 'mintcream', hex: '#f5fffa' },
  { name: 'mistyrose', hex: '#ffe4e1' },
  { name: 'moccasin', hex: '#ffe4b5' },
  { name: 'navajowhite', hex: '#ffdead' },
  { name: 'navy', hex: '#000080' },
  { name: 'oldlace', hex: '#fdf5e6' },
  { name: 'olive', hex: '#808000' },
  { name: 'olivedrab', hex: '#6b8e23' },
  { name: 'orange', hex: '#ffa500' },
  { name: 'orangered', hex: '#ff4500' },
  { name: 'orchid', hex: '#da70d6' },
  { name: 'palegoldenrod', hex: '#eee8aa' },
  { name: 'palegreen', hex: '#98fb98' },
  { name: 'paleturquoise', hex: '#afeeee' },
  { name: 'palevioletred', hex: '#db7093' },
  { name: 'papayawhip', hex: '#ffefd5' },
  { name: 'peachpuff', hex: '#ffdab9' },
  { name: 'peru', hex: '#cd853f' },
  { name: 'pink', hex: '#ffc0cb' },
  { name: 'plum', hex: '#dda0dd' },
  { name: 'powderblue', hex: '#b0e0e6' },
  { name: 'purple', hex: '#800080' },
  { name: 'rebeccapurple', hex: '#663399' },
  { name: 'red', hex: '#ff0000' },
  { name: 'rosybrown', hex: '#bc8f8f' },
  { name: 'royalblue', hex: '#4169e1' },
  { name: 'saddlebrown', hex: '#8b4513' },
  { name: 'salmon', hex: '#fa8072' },
  { name: 'sandybrown', hex: '#f4a460' },
  { name: 'seagreen', hex: '#2e8b57' },
  { name: 'seashell', hex: '#fff5ee' },
  { name: 'sienna', hex: '#a0522d' },
  { name: 'silver', hex: '#c0c0c0' },
  { name: 'skyblue', hex: '#87ceeb' },
  { name: 'slateblue', hex: '#6a5acd' },
  { name: 'slategray', hex: '#708090' },
  { name: 'snow', hex: '#fffafa' },
  { name: 'springgreen', hex: '#00ff7f' },
  { name: 'steelblue', hex: '#4682b4' },
  { name: 'tan', hex: '#d2b48c' },
  { name: 'teal', hex: '#008080' },
  { name: 'thistle', hex: '#d8bfd8' },
  { name: 'tomato', hex: '#ff6347' },
  { name: 'turquoise', hex: '#40e0d0' },
  { name: 'violet', hex: '#ee82ee' },
  { name: 'wheat', hex: '#f5deb3' },
  { name: 'white', hex: '#ffffff' },
  { name: 'whitesmoke', hex: '#f5f5f5' },
  { name: 'yellow', hex: '#ffff00' },
  { name: 'yellowgreen', hex: '#9acd32' },
]

const cssColorDb = CSS_NAMED_COLORS.map((entry) => ({
  name: entry.name,
  lab: hexToOklab(entry.hex),
}))

// Threshold for CSS color match (squared distance in Oklab)
// ~0.02 linear ≈ 0.0004 squared
const CSS_MATCH_THRESHOLD_SQ = 0.0004

type ColorNameResult = {
  name: string
  cssName: string | null
}

/**
 * Find the closest human-readable name for a hex color using
 * nearest-neighbor lookup in Oklab perceptual color space.
 */
export function getColorName(hex: string): ColorNameResult {
  const lab = hexToOklab(hex)

  // Find nearest color name
  let bestName = colorDb[0].name
  let bestDist = Infinity
  for (const entry of colorDb) {
    const dist = oklabDistanceSq(lab, entry.lab)
    if (dist < bestDist) {
      bestDist = dist
      bestName = entry.name
    }
  }

  // Check for close CSS named color
  let cssName: string | null = null
  let bestCssDist = Infinity
  for (const entry of cssColorDb) {
    const dist = oklabDistanceSq(lab, entry.lab)
    if (dist < bestCssDist) {
      bestCssDist = dist
      cssName = entry.name
    }
  }

  return {
    name: bestName,
    cssName: bestCssDist < CSS_MATCH_THRESHOLD_SQ ? cssName : null,
  }
}
