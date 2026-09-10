type RGB = [number, number, number]

type WeightedColor = {
  color: RGB
  count: number
}

const DEFAULT_COLOR_COUNT = 10
const MIN_INCLUDED_ALPHA = 128
const MAX_ITERATIONS = 20

function distanceSquared(a: RGB, b: RGB): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

function colorKey([r, g, b]: RGB): string {
  return `${r},${g},${b}`
}

function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

function collectOpaqueColors(pixelData: ArrayLike<number>): WeightedColor[] {
  const colors = new Map<string, WeightedColor>()

  for (let i = 0; i < pixelData.length; i += 4) {
    const red = pixelData[i]
    const green = pixelData[i + 1]
    const blue = pixelData[i + 2]
    const alpha = pixelData[i + 3]

    if (![red, green, blue, alpha].every(Number.isFinite) || alpha <= MIN_INCLUDED_ALPHA) continue

    const color: RGB = [red, green, blue].map(channel => (
      Math.round(Math.max(0, Math.min(255, channel)))
    )) as RGB
    const key = colorKey(color)
    const existing = colors.get(key)

    if (existing) existing.count++
    else colors.set(key, { color, count: 1 })
  }

  return [...colors.values()]
}

function chooseInitialCentroids(colors: WeightedColor[], count: number): RGB[] {
  let mostFrequent = colors[0]
  for (const candidate of colors.slice(1)) {
    if (candidate.count > mostFrequent.count) mostFrequent = candidate
  }

  const centroids: RGB[] = [[...mostFrequent.color]]

  while (centroids.length < count) {
    let bestColor: WeightedColor | null = null
    let bestDistance = -1

    for (const candidate of colors) {
      const nearestDistance = Math.min(
        ...centroids.map(centroid => distanceSquared(candidate.color, centroid)),
      )

      if (
        nearestDistance > bestDistance
        || (nearestDistance === bestDistance && bestColor !== null && candidate.count > bestColor.count)
      ) {
        bestColor = candidate
        bestDistance = nearestDistance
      }
    }

    if (!bestColor || bestDistance <= 0) break
    centroids.push([...bestColor.color])
  }

  return centroids
}

function runKMeans(colors: WeightedColor[], count: number): RGB[] {
  let centroids = chooseInitialCentroids(colors, count)

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const sums: RGB[] = Array.from({ length: centroids.length }, () => [0, 0, 0])
    const counts = new Array<number>(centroids.length).fill(0)

    for (const { color, count: frequency } of colors) {
      let nearestIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY

      for (let i = 0; i < centroids.length; i++) {
        const distance = distanceSquared(color, centroids[i])
        if (distance < nearestDistance) {
          nearestIndex = i
          nearestDistance = distance
        }
      }

      sums[nearestIndex][0] += color[0] * frequency
      sums[nearestIndex][1] += color[1] * frequency
      sums[nearestIndex][2] += color[2] * frequency
      counts[nearestIndex] += frequency
    }

    let moved = false
    const nextCentroids = centroids.map((centroid, i): RGB => {
      if (counts[i] === 0) return centroid

      const next: RGB = [
        Math.round(sums[i][0] / counts[i]),
        Math.round(sums[i][1] / counts[i]),
        Math.round(sums[i][2] / counts[i]),
      ]
      if (colorKey(next) !== colorKey(centroid)) moved = true
      return next
    })

    centroids = nextCentroids
    if (!moved) break
  }

  return centroids
}

function ensureUniquePalette(centroids: RGB[], colors: WeightedColor[], count: number): RGB[] {
  const palette = [...new Map(centroids.map(color => [colorKey(color), color])).values()]
  const paletteKeys = new Set(palette.map(colorKey))

  while (palette.length < count) {
    let bestColor: WeightedColor | null = null
    let bestDistance = -1

    for (const candidate of colors) {
      if (paletteKeys.has(colorKey(candidate.color))) continue
      const nearestDistance = Math.min(
        ...palette.map(color => distanceSquared(candidate.color, color)),
      )

      if (
        nearestDistance > bestDistance
        || (nearestDistance === bestDistance && bestColor !== null && candidate.count > bestColor.count)
      ) {
        bestColor = candidate
        bestDistance = nearestDistance
      }
    }

    if (!bestColor) break
    palette.push([...bestColor.color])
    paletteKeys.add(colorKey(bestColor.color))
  }

  return palette
}

function sortByDominance(palette: RGB[], colors: WeightedColor[]): RGB[] {
  const clusterCounts = new Array<number>(palette.length).fill(0)

  for (const { color, count } of colors) {
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < palette.length; i++) {
      const distance = distanceSquared(color, palette[i])
      if (distance < nearestDistance) {
        nearestIndex = i
        nearestDistance = distance
      }
    }
    clusterCounts[nearestIndex] += count
  }

  return palette
    .map((color, index) => ({ color, index, count: clusterCounts[index] }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ color }) => color)
}

export function quantizeImagePixels(
  pixelData: ArrayLike<number>,
  requestedColorCount = DEFAULT_COLOR_COUNT,
): string[] {
  const normalizedColorCount = Math.floor(requestedColorCount)
  if (
    pixelData.length === 0
    || pixelData.length % 4 !== 0
    || !Number.isFinite(requestedColorCount)
    || normalizedColorCount <= 0
  ) return []

  const colors = collectOpaqueColors(pixelData)
  if (colors.length === 0) return []

  const colorCount = Math.min(normalizedColorCount, colors.length)
  const centroids = runKMeans(colors, colorCount)
  const palette = ensureUniquePalette(centroids, colors, colorCount)

  return sortByDominance(palette, colors).map(rgbToHex)
}
