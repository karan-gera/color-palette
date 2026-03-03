import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ExtractViewProps = {
  onAddColors: (colors: string[]) => void
}

// ---------------------------------------------------------------------------
// Color extraction — Canvas API + k-means clustering
// ---------------------------------------------------------------------------

type RGB = [number, number, number]

function dist2(a: RGB, b: RGB): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

function kmeans(pixels: RGB[], k: number, maxIter = 20): RGB[] {
  if (pixels.length === 0) return []
  const n = Math.min(k, pixels.length)
  const step = Math.floor(pixels.length / n)
  let centroids: RGB[] = Array.from({ length: n }, (_, i) => [...pixels[i * step]] as RGB)

  for (let iter = 0; iter < maxIter; iter++) {
    const sums: RGB[] = Array.from({ length: n }, () => [0, 0, 0])
    const counts = new Array<number>(n).fill(0)

    for (const px of pixels) {
      let best = 0, bestDist = Infinity
      for (let c = 0; c < n; c++) {
        const d = dist2(px, centroids[c])
        if (d < bestDist) { bestDist = d; best = c }
      }
      sums[best][0] += px[0]
      sums[best][1] += px[1]
      sums[best][2] += px[2]
      counts[best]++
    }

    let moved = false
    const next: RGB[] = centroids.map((c, i) => {
      if (counts[i] === 0) return c
      const nr = Math.round(sums[i][0] / counts[i])
      const ng = Math.round(sums[i][1] / counts[i])
      const nb = Math.round(sums[i][2] / counts[i])
      if (nr !== c[0] || ng !== c[1] || nb !== c[2]) moved = true
      return [nr, ng, nb] as RGB
    })
    centroids = next
    if (!moved) break
  }

  return centroids
}

function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function extractColorsFromImage(src: string, k = 10): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 150
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve([]); return }
      ctx.drawImage(img, 0, 0, w, h)
      const data = ctx.getImageData(0, 0, w, h).data
      const pixels: RGB[] = []
      for (let i = 0; i < data.length; i += 4 * 3) {
        if (data[i + 3] > 128) pixels.push([data[i], data[i + 1], data[i + 2]])
      }
      resolve(kmeans(pixels, k).map(rgbToHex))
    }
    img.onerror = () => reject(new Error('could not load image'))
    img.src = src
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ExtractView({ onAddColors }: ExtractViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [extracted, setExtracted] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setImageSrc(url)
    setExtracted([])
    setSelected(new Set())
    setIsExtracting(true)
    setExtractError(null)
    extractColorsFromImage(url, 10).then(colors => {
      setExtracted(colors)
      setSelected(new Set(colors.map((_, i) => i)))
      setIsExtracting(false)
    }).catch(() => {
      setExtractError('could not load image — try a different file')
      setIsExtracting(false)
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }, [loadFile])

  // Drag-to-toggle: mousedown records whether this drag selects or deselects,
  // then mouseenter applies the same operation to every swatch crossed.
  const dragMode = useRef<'select' | 'deselect' | null>(null)

  const handleSwatchMouseDown = useCallback((i: number, e: React.MouseEvent) => {
    e.preventDefault()
    setSelected(prev => {
      const next = new Set(prev)
      dragMode.current = next.has(i) ? 'deselect' : 'select'
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
    const onMouseUp = () => {
      dragMode.current = null
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  const handleSwatchMouseEnter = useCallback((i: number) => {
    if (dragMode.current === null) return
    setSelected(prev => {
      const next = new Set(prev)
      dragMode.current === 'select' ? next.add(i) : next.delete(i)
      return next
    })
  }, [])

  return (
    <div className="w-full max-w-4xl px-8 py-6 flex flex-col gap-6">
      {/* Drop zone — 16:9 proportioned, same as gradient preview */}
      <motion.div
        className="w-full relative"
        style={{ paddingBottom: '56.25%' }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={[
            'absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer gap-3 p-8 text-center select-none overflow-hidden',
            isDragging
              ? 'border-foreground/60 bg-foreground/5'
              : 'border-border hover:border-foreground/30 hover:bg-foreground/[0.02]',
          ].join(' ')}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="uploaded"
              className="max-h-full max-w-full rounded-lg object-contain pointer-events-none"
            />
          ) : (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="size-5" />
                <ImageIcon className="size-5" />
              </div>
              <p className="font-mono text-sm text-muted-foreground lowercase">
                drop an image here, or click to browse
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/50 lowercase">
                png, jpg, gif, webp — dominant colors extracted client-side
              </p>
            </>
          )}
        </div>
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Loading */}
      {isExtracting && (
        <motion.p
          className="font-mono text-xs text-muted-foreground lowercase animate-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          extracting colors…
        </motion.p>
      )}

      {/* Error */}
      {extractError && (
        <motion.p
          className="font-mono text-xs text-destructive lowercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {extractError}
        </motion.p>
      )}

      {/* Extracted swatches */}
      {extracted.length > 0 && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <p className="font-mono text-xs text-muted-foreground lowercase">
            extracted colors — click or drag to toggle
          </p>
          <div className="flex gap-3 flex-wrap select-none">
            {extracted.map((hex, i) => {
              const isSel = selected.has(i)
              return (
                <button
                  key={i}
                  type="button"
                  onMouseDown={e => handleSwatchMouseDown(i, e)}
                  onMouseEnter={() => handleSwatchMouseEnter(i)}
                  className={[
                    'flex flex-col items-center gap-1.5 transition-all duration-150',
                    isSel ? 'opacity-100' : 'opacity-35',
                  ].join(' ')}
                  aria-label={hex}
                >
                  <div
                    className={[
                      'size-12 rounded-md border transition-all duration-150',
                      isSel
                        ? 'border-foreground/40 ring-2 ring-foreground ring-offset-2 ring-offset-background scale-105'
                        : 'border-border',
                    ].join(' ')}
                    style={{ backgroundColor: hex }}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{hex}</span>
                </button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono lowercase self-start"
            disabled={selected.size === 0}
            onClick={() => onAddColors(extracted.filter((_, i) => selected.has(i)))}
          >
            add {selected.size} color{selected.size !== 1 ? 's' : ''} to palette
          </Button>
        </motion.div>
      )}
    </div>
  )
}
