import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ExtractViewProps = {
  palette: string[]
  colorIds: string[]
  onAddColors: (colors: string[]) => void
}

// TODO: replace with real extraction (k-means / median cut via Canvas API)
const PLACEHOLDER_EXTRACTED: string[] = []

export default function ExtractView({ onAddColors }: ExtractViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [extracted] = useState<string[]>(PLACEHOLDER_EXTRACTED)

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    // TODO: draw to canvas, read pixel data, run quantization, setExtracted(...)
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

  return (
    <div className="w-full max-w-4xl px-8 py-6 flex flex-col gap-6">
      {/* Drop zone */}
      <motion.div
        className={[
          'relative flex flex-col items-center justify-center min-h-56 rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer gap-3 p-8 text-center select-none',
          isDragging
            ? 'border-foreground/60 bg-foreground/5'
            : 'border-border hover:border-foreground/30 hover:bg-foreground/[0.02]',
        ].join(' ')}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="uploaded"
            className="max-h-40 max-w-full rounded-lg object-contain pointer-events-none"
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
      </motion.div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Extracted swatches + add button */}
      {extracted.length > 0 && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <p className="font-mono text-xs text-muted-foreground lowercase">
            extracted colors — click to deselect
          </p>
          <div className="flex gap-2 flex-wrap">
            {extracted.map((hex, i) => (
              <button
                key={i}
                type="button"
                className="size-10 rounded-md border border-border transition-all duration-150 hover:scale-105"
                style={{ backgroundColor: hex }}
                aria-label={hex}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono lowercase text-xs self-start"
            onClick={() => onAddColors(extracted)}
          >
            add to palette
          </Button>
        </motion.div>
      )}

      {/* Empty state after image load, pending extraction */}
      {imageSrc && extracted.length === 0 && (
        <motion.p
          className="font-mono text-xs text-muted-foreground lowercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          extraction not yet implemented — coming soon
        </motion.p>
      )}
    </div>
  )
}
