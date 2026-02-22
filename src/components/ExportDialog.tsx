import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Copy, Download, Check, ChevronDown, ChevronUp, Image } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import DialogKeyboardHints from './DialogKeyboardHints'
import {
  EXPORT_FORMATS,
  APP_INFO,
  exportPalette,
  copyToClipboard,
  downloadFile,
  type ExportFormat,
  type ExportFormatInfo,
  type AppInfo,
} from '@/helpers/exportFormats'
import {
  exportPng,
  exportSvg,
  downloadBlob,
  downloadSvg,
  SIZE_CONFIG,
  type ImageLabels,
  type ImageSize,
} from '@/helpers/imageExport'
import { getColorName } from '@/helpers/colorNaming'

type ExportDialogProps = {
  colors: string[]
  onCancel: () => void
  onCopied?: (message: string) => void
  initialView?: 'selecting' | 'image'
}

type DialogView =
  | { type: 'selecting' }
  | { type: 'confirmation'; format: ExportFormatInfo; wasDownload: boolean }
  | { type: 'howToUse'; format: ExportFormatInfo }
  | { type: 'image' }
  | { type: 'imageConfirmation'; format: 'png' | 'svg' }

export default function ExportDialog({ colors, onCancel, onCopied, initialView = 'selecting' }: ExportDialogProps) {
  const [view, setView] = useState<DialogView>({ type: initialView })

  const handleExport = useCallback(async (format: ExportFormat) => {
    const formatInfo = EXPORT_FORMATS.find(f => f.value === format)
    if (!formatInfo) return

    const content = await exportPalette(colors, format)

    if (formatInfo.isDownload) {
      downloadFile(content, `palette.${formatInfo.extension}`)
      setView({ type: 'confirmation', format: formatInfo, wasDownload: true })
    } else {
      const success = await copyToClipboard(content as string)
      if (success) {
        onCopied?.(`Copied ${formatInfo.label}`)
        onCancel()
      }
    }
  }, [colors, onCopied, onCancel])

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={view.type === 'image' || view.type === 'imageConfirmation' ? 'sm:max-w-xl' : 'sm:max-w-lg'}>
        {view.type === 'selecting' && (
          <ExportSelectingView
            onExport={handleExport}
            onImageExport={() => setView({ type: 'image' })}
          />
        )}
        {view.type === 'image' && (
          <ExportImageView
            colors={colors}
            onBack={() => setView({ type: 'selecting' })}
            onExported={(fmt) => setView({ type: 'imageConfirmation', format: fmt })}
          />
        )}
        {view.type === 'confirmation' && (
          <ExportConfirmationView
            format={view.format}
            wasDownload={view.wasDownload}
            onHowToUse={() => setView({ type: 'howToUse', format: view.format })}
            onDone={onCancel}
          />
        )}
        {view.type === 'imageConfirmation' && (
          <ExportImageConfirmationView
            format={view.format}
            onDone={onCancel}
          />
        )}
        {view.type === 'howToUse' && (
          <ExportHowToUseView
            format={view.format}
            onBack={() => setView({ type: 'confirmation', format: view.format, wasDownload: true })}
            onDone={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const HINTS = [
  { key: '↑↓', label: 'select' },
  { key: 'Enter', label: 'export' },
  { key: 'Esc', label: 'cancel' },
]

const SCROLL_INDICATOR_DEBOUNCE = 500

type ExportSelectingViewProps = {
  onExport: (format: ExportFormat) => void
  onImageExport: () => void
}

function ExportSelectingView({ onExport, onImageExport }: ExportSelectingViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [showArrowUp, setShowArrowUp] = useState(false)
  const [showArrowDown, setShowArrowDown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const arrowUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arrowDownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalItems = EXPORT_FORMATS.length + 1 // code formats + image option

  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const atTop = scrollTop <= 1
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1

    const newCanScrollUp = !atTop
    const newCanScrollDown = !atBottom && scrollHeight > clientHeight

    setCanScrollUp(newCanScrollUp)
    setCanScrollDown(newCanScrollDown)

    if (newCanScrollUp) {
      if (!arrowUpTimeoutRef.current) {
        arrowUpTimeoutRef.current = setTimeout(() => {
          setShowArrowUp(true)
          arrowUpTimeoutRef.current = null
        }, SCROLL_INDICATOR_DEBOUNCE)
      }
    } else {
      if (arrowUpTimeoutRef.current) {
        clearTimeout(arrowUpTimeoutRef.current)
        arrowUpTimeoutRef.current = null
      }
      setShowArrowUp(false)
    }

    if (newCanScrollDown) {
      if (!arrowDownTimeoutRef.current) {
        arrowDownTimeoutRef.current = setTimeout(() => {
          setShowArrowDown(true)
          arrowDownTimeoutRef.current = null
        }, SCROLL_INDICATOR_DEBOUNCE)
      }
    } else {
      if (arrowDownTimeoutRef.current) {
        clearTimeout(arrowDownTimeoutRef.current)
        arrowDownTimeoutRef.current = null
      }
      setShowArrowDown(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(updateScrollIndicators, 50)
    return () => clearTimeout(timer)
  }, [updateScrollIndicators])

  useEffect(() => {
    return () => {
      if (arrowUpTimeoutRef.current) clearTimeout(arrowUpTimeoutRef.current)
      if (arrowDownTimeoutRef.current) clearTimeout(arrowDownTimeoutRef.current)
    }
  }, [])

  const scrollToSelected = useCallback((index: number) => {
    const container = scrollContainerRef.current
    const item = itemRefs.current[index]
    if (!item || !container) return

    if (index === 0) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (index === totalItems - 1) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    } else {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [totalItems])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault()
          if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1
            setSelectedIndex(newIndex)
            scrollToSelected(newIndex)
          }
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          if (selectedIndex < totalItems - 1) {
            const newIndex = selectedIndex + 1
            setSelectedIndex(newIndex)
            scrollToSelected(newIndex)
          }
          break
        }
        case 'Enter':
          e.preventDefault()
          if (selectedIndex === 4) {
            onImageExport()
          } else if (selectedIndex < 4) {
            onExport(EXPORT_FORMATS[selectedIndex].value)
          } else {
            onExport(EXPORT_FORMATS[selectedIndex - 1].value)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, onExport, onImageExport, scrollToSelected, totalItems])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono lowercase">export palette</DialogTitle>
      </DialogHeader>

      <div className="relative">
        <div
          className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10 flex items-start justify-center pt-1 transition-opacity duration-200 ${
            canScrollUp ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ChevronUp className={`size-4 text-muted-foreground transition-opacity duration-200 ${showArrowUp ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={updateScrollIndicators}
          className="grid gap-0.5 py-1 px-1 max-h-[400px] overflow-y-auto scrollbar-none"
        >
          {EXPORT_FORMATS.slice(0, 4).map((format, index) => (
            <Button
              key={format.value}
              ref={(el) => { itemRefs.current[index] = el }}
              variant="ghost"
              className={`w-full justify-between font-mono text-sm h-auto py-2.5 px-3 ${
                selectedIndex === index ? 'ring-2 ring-ring bg-accent' : ''
              }`}
              onClick={() => onExport(format.value)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1 mr-2">
                <span className="lowercase">{format.label}</span>
                <span className="text-[10px] text-muted-foreground text-left">
                  {format.compatibleApps.length > 0
                    ? `Works with: ${getAppNames(format.compatibleApps)}`
                    : format.description
                  }
                </span>
              </div>
              {format.isDownload ? (
                <Download className="size-4 opacity-50 shrink-0" />
              ) : (
                <Copy className="size-4 opacity-50 shrink-0" />
              )}
            </Button>
          ))}

          <Button
            ref={(el) => { itemRefs.current[4] = el }}
            variant="ghost"
            className={`w-full justify-between font-mono text-sm h-auto py-2.5 px-3 ${
              selectedIndex === 4 ? 'ring-2 ring-ring bg-accent' : ''
            }`}
            onClick={onImageExport}
            onMouseEnter={() => setSelectedIndex(4)}
          >
            <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1 mr-2">
              <span className="lowercase">image (png / svg)</span>
              <span className="text-[10px] text-muted-foreground text-left">
                Download as image for sharing
              </span>
            </div>
            <Image className="size-4 opacity-50 shrink-0" />
          </Button>

          {EXPORT_FORMATS.slice(4).map((format, index) => {
            const actualIndex = index + 5
            return (
              <Button
                key={format.value}
                ref={(el) => { itemRefs.current[actualIndex] = el }}
                variant="ghost"
                className={`w-full justify-between font-mono text-sm h-auto py-2.5 px-3 ${
                  selectedIndex === actualIndex ? 'ring-2 ring-ring bg-accent' : ''
                }`}
                onClick={() => onExport(format.value)}
                onMouseEnter={() => setSelectedIndex(actualIndex)}
              >
                <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1 mr-2">
                  <span className="lowercase">{format.label}</span>
                  <span className="text-[10px] text-muted-foreground text-left">
                    {format.compatibleApps.length > 0
                      ? `Works with: ${getAppNames(format.compatibleApps)}`
                      : format.description
                    }
                  </span>
                </div>
                {format.isDownload ? (
                  <Download className="size-4 opacity-50 shrink-0" />
                ) : (
                  <Copy className="size-4 opacity-50 shrink-0" />
                )}
              </Button>
            )
          })}
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10 flex items-end justify-center pb-1 transition-opacity duration-200 ${
            canScrollDown ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ChevronDown className={`size-4 text-muted-foreground transition-opacity duration-200 ${showArrowDown ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground font-mono text-center px-4 py-1.5 border-t">
        Can't find your format? Click any color's hex code to copy it individually.
      </p>

      <DialogKeyboardHints hints={HINTS} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const LABEL_OPTIONS: { value: ImageLabels; label: string }[] = [
  { value: 'none', label: 'none' },
  { value: 'hex', label: 'hex' },
  { value: 'name', label: 'names' },
]

const SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
  { value: 'small', label: SIZE_CONFIG.small.label },
  { value: 'medium', label: SIZE_CONFIG.medium.label },
  { value: 'large', label: SIZE_CONFIG.large.label },
]

type ExportImageViewProps = {
  colors: string[]
  onBack: () => void
  onExported: (format: 'png' | 'svg') => void
}

function ExportImageView({ colors, onBack, onExported }: ExportImageViewProps) {
  const [imageLabels, setImageLabels] = useState<ImageLabels>('hex')
  const [imageSize, setImageSize] = useState<ImageSize>('medium')
  const [imageFormat, setImageFormat] = useState<'png' | 'svg'>('png')
  const [isExporting, setIsExporting] = useState(false)

  const colorNames = useMemo(() => colors.map(c => getColorName(c).name), [colors])

  const previewSvg = useMemo(() =>
    exportSvg(colors, { layout: 'grid', labels: imageLabels, size: 'small', colorNames }),
    [colors, imageLabels, colorNames]
  )

  const handleExportPng = useCallback(async () => {
    setIsExporting(true)
    try {
      const blob = await exportPng(colors, { layout: 'grid', labels: imageLabels, size: imageSize, colorNames })
      downloadBlob(blob, 'palette.png')
      onExported('png')
    } finally {
      setIsExporting(false)
    }
  }, [colors, imageLabels, imageSize, colorNames, onExported])

  const handleExportSvg = useCallback(() => {
    const svg = exportSvg(colors, { layout: 'grid', labels: imageLabels, size: imageSize, colorNames })
    downloadSvg(svg, 'palette.svg')
    onExported('svg')
  }, [colors, imageLabels, imageSize, colorNames, onExported])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono lowercase">export as image</DialogTitle>
      </DialogHeader>

      <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center">
        <div
          className="[&>svg]:w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
      </div>

      <div className="flex gap-6 py-2">
        <div className="grid gap-1.5">
          <label className="text-xs font-mono lowercase text-muted-foreground">labels</label>
          <ToggleGroup
            type="single"
            value={imageLabels}
            onValueChange={(v) => v && setImageLabels(v as ImageLabels)}
            variant="outline"
            size="sm"
          >
            {LABEL_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="font-mono text-xs lowercase">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-mono lowercase text-muted-foreground">size</label>
          <ToggleGroup
            type="single"
            value={imageSize}
            onValueChange={(v) => v && setImageSize(v as ImageSize)}
            variant="outline"
            size="sm"
          >
            {SIZE_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="font-mono text-xs lowercase">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-mono lowercase text-muted-foreground">format</label>
          <ToggleGroup
            type="single"
            value={imageFormat}
            onValueChange={(v) => v && setImageFormat(v as 'png' | 'svg')}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="png" className="font-mono text-xs lowercase">png</ToggleGroupItem>
            <ToggleGroupItem value="svg" className="font-mono text-xs lowercase">svg</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onBack} className="font-mono lowercase">
          back
        </Button>
        <Button
          onClick={imageFormat === 'png' ? handleExportPng : handleExportSvg}
          disabled={isExporting}
          className="font-mono lowercase"
        >
          {isExporting ? 'exporting...' : 'download'}
        </Button>
      </DialogFooter>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type ExportConfirmationViewProps = {
  format: ExportFormatInfo
  wasDownload: boolean
  onHowToUse: () => void
  onDone: () => void
}

function ExportConfirmationView({ format, wasDownload, onHowToUse, onDone }: ExportConfirmationViewProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono lowercase">export complete</DialogTitle>
      </DialogHeader>

      <div className="py-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="size-6 text-green-500" />
          </div>
        </div>
        <p className="font-mono text-sm">
          {wasDownload ? 'Your palette has been downloaded!' : 'Copied to clipboard!'}
        </p>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {format.label} ({format.extension})
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 font-mono lowercase" onClick={onHowToUse}>
          how to use
        </Button>
        <Button className="flex-1 font-mono lowercase" onClick={onDone}>
          done
        </Button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type ExportImageConfirmationViewProps = {
  format: 'png' | 'svg'
  onDone: () => void
}

function ExportImageConfirmationView({ format, onDone }: ExportImageConfirmationViewProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono lowercase">export complete</DialogTitle>
      </DialogHeader>

      <div className="py-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="size-6 text-green-500" />
          </div>
        </div>
        <p className="font-mono text-sm">Your palette image has been downloaded!</p>
        <p className="text-xs text-muted-foreground font-mono mt-1">palette.{format}</p>
      </div>

      <Button className="w-full font-mono lowercase" onClick={onDone}>
        done
      </Button>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

type ExportHowToUseViewProps = {
  format: ExportFormatInfo
  onBack: () => void
  onDone: () => void
}

function ExportHowToUseView({ format, onBack, onDone }: ExportHowToUseViewProps) {
  const [selectedApp, setSelectedApp] = useState<AppInfo | 'other' | null>(null)
  const compatibleApps = APP_INFO.filter(app => format.compatibleApps.includes(app.id))

  const getSelectedLabel = () => {
    if (!selectedApp) return 'Select your app...'
    if (selectedApp === 'other') return 'Other / Not listed'
    return selectedApp.name
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono lowercase">how to use {format.label}</DialogTitle>
      </DialogHeader>

      <div className="pt-1">
        <p className="text-xs text-muted-foreground font-mono mb-2">
          What app are you importing to?
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-mono text-sm lowercase">
              {getSelectedLabel()}
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
            {compatibleApps.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="font-mono text-sm lowercase cursor-pointer"
              >
                {app.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onClick={() => setSelectedApp('other')}
              className="font-mono text-sm lowercase cursor-pointer"
            >
              Other / Not listed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedApp && selectedApp !== 'other' && (
        <div className="bg-muted/50 rounded-md p-3 mt-2 mb-4">
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
            import steps for {selectedApp.name}
          </p>
          <ol className="text-xs font-mono space-y-1.5">
            {selectedApp.importSteps.map((step, i) => (
              <li key={i} className="text-muted-foreground">
                <span className="text-foreground font-medium">{i + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {selectedApp === 'other' && (
        <div className="bg-muted/50 rounded-md p-3 mt-2 mb-4 space-y-3">
          <div>
            <p className="text-xs font-mono font-medium mb-1">Check your software's documentation</p>
            <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
              Look for "import palette", "load swatches", or "color presets" in your app's
              help menu. The file extension ({format.extension}) can help you find the right import option.
            </p>
          </div>

          <div>
            <p className="text-xs font-mono font-medium mb-1">If no format works</p>
            <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
              You can copy colors one-by-one: click any color's hex code on the main palette
              to copy it in your preferred format (HEX, RGB, HSL, etc).
            </p>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-mono font-medium mb-1">Missing your app?</p>
            <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
              We'd love to add support for more formats!{' '}
              <a
                href="https://github.com/your-repo/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Submit a request
              </a>
              {' '}and let us know what software and format you need.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 font-mono lowercase" onClick={onBack}>
          back
        </Button>
        <Button className="flex-1 font-mono lowercase" onClick={onDone}>
          done
        </Button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function getAppNames(appIds: string[]): string {
  return appIds
    .map(id => APP_INFO.find(a => a.id === id)?.name ?? id)
    .join(', ')
}
