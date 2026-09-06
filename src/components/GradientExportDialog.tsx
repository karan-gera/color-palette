import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
  const formats = useMemo(() => buildFormats(aspectRatio), [aspectRatio])
  const dialogRef = useRef<HTMLDivElement>(null)
  const initialActionRef = useRef<HTMLButtonElement>(null)
  const formatButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Restore focus to the control that opened the dialog.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    return () => {
      previouslyFocusedRef.current?.focus()
    }
  }, [])

  // Focus the first action on open and whenever the dialog changes view.
  useEffect(() => {
    initialActionRef.current?.focus()
  }, [view.type])

  // Close on Escape and keep keyboard focus inside the modal.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancel()
        return
      }

      if (e.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ))

      if (focusable.length === 0) {
        e.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement

      if (e.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
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
    [formats, config, aspectRatio, isExporting, onCopied],
  )

  const { selectedIndex, setSelectedIndex } = useListKeyboardNav({
    count: formats.length,
    onEnter: handleExport,
    onNavigate: index => formatButtonRefs.current[index]?.focus(),
    enabled: view.type === 'selecting',
  })

  const confirmationFormat = view.type === 'confirmation'
    ? formats.find(format => format.id === view.formatId)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gradient-export-dialog-title"
        tabIndex={-1}
        onKeyDown={event => {
          // Let focused buttons handle Enter themselves instead of the list-level shortcut.
          if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) {
            event.stopPropagation()
          }
        }}
        className={[
          'bg-background border border-border rounded-xl shadow-xl w-full max-w-sm mx-4',
          view.type === 'confirmation' ? 'p-6 flex flex-col items-center gap-4' : 'overflow-hidden',
        ].join(' ')}
      >
        {view.type === 'confirmation' && confirmationFormat ? (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center">
              <Check size={24} className="text-green-500" aria-hidden="true" />
            </div>
            <div className="text-center">
              <h2 id="gradient-export-dialog-title" className="font-mono text-sm lowercase">
                {confirmationFormat.action === 'copy' ? 'copied to clipboard' : 'downloaded'}
              </h2>
              <p className="font-mono text-xs text-muted-foreground mt-1 lowercase">
                {confirmationFormat.label}{confirmationFormat.ext}
              </p>
              {view.warning && (
                <p className="font-mono text-xs text-amber-500 mt-2 lowercase">
                  {view.warning}
                </p>
              )}
            </div>
            <div className="flex gap-2 w-full">
              <Button
                ref={initialActionRef}
                type="button"
                variant="outline"
                size="sm"
                className="font-mono lowercase flex-1"
                onClick={() => setView({ type: 'selecting' })}
              >
                export another
              </Button>
              <Button
                type="button"
                size="sm"
                className="font-mono lowercase flex-1"
                onClick={onCancel}
              >
                done
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 id="gradient-export-dialog-title" className="font-mono text-sm lowercase">
                export gradient
              </h2>
              <button
                type="button"
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
                    ref={element => {
                      formatButtonRefs.current[i] = element
                      if (i === 0) initialActionRef.current = element
                    }}
                    type="button"
                    key={format.id}
                    className={[
                      'w-full text-left px-3 py-3 rounded-lg flex items-start gap-3 transition-colors duration-100',
                      isSelected
                        ? 'bg-foreground/8 text-foreground'
                        : 'hover:bg-foreground/5 text-foreground',
                    ].join(' ')}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onFocus={() => setSelectedIndex(i)}
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
          </>
        )}
      </div>
    </div>
  )
}
