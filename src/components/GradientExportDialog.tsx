import { useState, useCallback, useEffect } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useListKeyboardNav } from '@/hooks/useListKeyboardNav'
import {
  generateLinearGradientCSS,
  generateGradientSVGFile,
  generateGradientPNGStrip,
  generateGradientTailwind,
  type LinearGradientConfig,
} from '@/helpers/gradientGenerator'

type GradientExportDialogProps = {
  config: LinearGradientConfig
  aspectRatio: number
  onCancel: () => void
  onCopied?: (message: string) => void
}

type FormatId = 'css' | 'svg' | 'png' | 'tailwind'

type ExportFormat = {
  id: FormatId
  label: string
  description: string
  ext: string
  action: 'copy' | 'download'
}

function getExportDimensions(aspectRatio: number): { width: number; height: number } {
  const MAX_DIM = 1920
  const h = Math.round(MAX_DIM / aspectRatio)
  if (h <= MAX_DIM) return { width: MAX_DIM, height: h }
  return { width: Math.round(MAX_DIM * aspectRatio), height: MAX_DIM }
}

function buildFormats(aspectRatio: number): ExportFormat[] {
  const { width, height } = getExportDimensions(aspectRatio)
  return [
    {
      id: 'css',
      label: 'CSS',
      description: 'linear-gradient(...) — paste into any stylesheet',
      ext: '',
      action: 'copy',
    },
    {
      id: 'tailwind',
      label: 'Tailwind',
      description: 'bg-gradient-to-r from-[…] — paste into className',
      ext: '',
      action: 'copy',
    },
    {
      id: 'svg',
      label: 'SVG file',
      description: `${width}×${height} vector — Illustrator, Affinity, Inkscape`,
      ext: '.svg',
      action: 'download',
    },
    {
      id: 'png',
      label: 'PNG',
      description: `${width}×${height}px raster — universal, Photoshop reference`,
      ext: '.png',
      action: 'download',
    },
  ]
}

type DialogView =
  | { type: 'selecting' }
  | { type: 'confirmation'; formatId: FormatId; warning?: string }

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function GradientExportDialog({
  config,
  aspectRatio,
  onCancel,
  onCopied,
}: GradientExportDialogProps) {
  const [view, setView] = useState<DialogView>({ type: 'selecting' })
  const [isExporting, setIsExporting] = useState(false)
  const formats = buildFormats(aspectRatio)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleExport = useCallback(
    async (index: number) => {
      const format = formats[index]
      if (!format || isExporting) return
      setIsExporting(true)

      try {
        if (format.id === 'css') {
          const css = generateLinearGradientCSS(config)
          await navigator.clipboard.writeText(css)
          setView({ type: 'confirmation', formatId: 'css' })
          onCopied?.('copied css gradient')
        } else if (format.id === 'tailwind') {
          const result = generateGradientTailwind(config)
          await navigator.clipboard.writeText(result.css)
          setView({ type: 'confirmation', formatId: 'tailwind', warning: result.warning })
          onCopied?.('copied tailwind gradient')
        } else if (format.id === 'svg') {
          const svg = generateGradientSVGFile(config, aspectRatio)
          const blob = new Blob([svg], { type: 'image/svg+xml' })
          downloadBlob(blob, 'gradient.svg')
          setView({ type: 'confirmation', formatId: 'svg' })
        } else if (format.id === 'png') {
          const blob = await generateGradientPNGStrip(config, aspectRatio)
          downloadBlob(blob, 'gradient.png')
          setView({ type: 'confirmation', formatId: 'png' })
        }
      } finally {
        setIsExporting(false)
      }
    },
    [config, aspectRatio, isExporting, onCopied],
  )

  const { selectedIndex, setSelectedIndex } = useListKeyboardNav({
    count: formats.length,
    onEnter: handleExport,
    enabled: view.type === 'selecting',
  })

  if (view.type === 'confirmation') {
    const format = formats.find(f => f.id === view.formatId)!
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
            <Check size={24} className="text-green-500" />
          </div>
          <div className="text-center">
            <p className="font-mono text-sm lowercase">
              {format.action === 'copy' ? 'copied to clipboard' : 'downloaded'}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-1 lowercase">
              {format.label}{format.ext}
            </p>
            {view.warning && (
              <p className="font-mono text-xs text-amber-500 mt-2 lowercase">
                {view.warning}
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="font-mono lowercase flex-1"
              onClick={() => setView({ type: 'selecting' })}
            >
              export another
            </Button>
            <Button
              size="sm"
              className="font-mono lowercase flex-1"
              onClick={onCancel}
            >
              done
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-mono text-sm lowercase">export gradient</h2>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Format list */}
        <div className="p-2">
          {formats.map((format, i) => {
            const isSelected = i === selectedIndex
            return (
              <button
                key={format.id}
                className={[
                  'w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors duration-100',
                  isSelected
                    ? 'bg-foreground/8 text-foreground'
                    : 'hover:bg-foreground/5 text-foreground',
                ].join(' ')}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => handleExport(i)}
                disabled={isExporting}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm lowercase flex items-center gap-2">
                    {format.label}
                    <span className="text-muted-foreground text-xs">
                      {format.action === 'copy' ? 'copy' : `download${format.ext}`}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5 lowercase">
                    {format.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-border">
          <p className="font-mono text-xs text-muted-foreground lowercase">
            ↑↓ navigate · enter to export
          </p>
        </div>
      </div>
    </div>
  )
}
