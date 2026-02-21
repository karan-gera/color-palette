import { useState, useEffect, useCallback, useRef } from 'react'
import { Copy, Download, Check, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

type ExportDialogProps = {
  colors: string[]
  onCancel: () => void
  onCopied?: (message: string) => void
}

type DialogView = 
  | { type: 'selecting' }
  | { type: 'confirmation'; format: ExportFormatInfo; wasDownload: boolean }
  | { type: 'howToUse'; format: ExportFormatInfo }

type SelectedOption = AppInfo | 'other' | null

const HINTS = [
  { key: '↑↓', label: 'select' },
  { key: 'Enter', label: 'export' },
  { key: 'Esc', label: 'cancel' },
]

const SCROLL_INDICATOR_DEBOUNCE = 500

export default function ExportDialog({ colors, onCancel, onCopied }: ExportDialogProps) {
  const [view, setView] = useState<DialogView>({ type: 'selecting' })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedApp, setSelectedApp] = useState<SelectedOption>(null)
  
  // Scroll indicator state
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [showArrowUp, setShowArrowUp] = useState(false)
  const [showArrowDown, setShowArrowDown] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const arrowUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const arrowDownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check scroll position
  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const atTop = scrollTop <= 1
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1

    const newCanScrollUp = !atTop
    const newCanScrollDown = !atBottom && scrollHeight > clientHeight

    // Update gradient visibility immediately
    setCanScrollUp(newCanScrollUp)
    setCanScrollDown(newCanScrollDown)

    // Handle arrow up with debounce
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

    // Handle arrow down with debounce
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

  // Initial check and cleanup
  useEffect(() => {
    if (view.type === 'selecting') {
      // Small delay to let the DOM render
      const timer = setTimeout(updateScrollIndicators, 50)
      return () => clearTimeout(timer)
    }
  }, [view.type, updateScrollIndicators])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (arrowUpTimeoutRef.current) clearTimeout(arrowUpTimeoutRef.current)
      if (arrowDownTimeoutRef.current) clearTimeout(arrowDownTimeoutRef.current)
    }
  }, [])

  const handleExport = useCallback(async (format: ExportFormat) => {
    const formatInfo = EXPORT_FORMATS.find(f => f.value === format)
    if (!formatInfo) return

    const content = await exportPalette(colors, format)
    
    if (formatInfo.isDownload) {
      downloadFile(content, `palette.${formatInfo.extension}`)
      setView({ type: 'confirmation', format: formatInfo, wasDownload: true })
    } else {
      // Clipboard copy - show toast and close immediately
      const success = await copyToClipboard(content as string)
      if (success) {
        onCopied?.(`Copied ${formatInfo.label}`)
        onCancel()
      }
    }
  }, [colors, onCopied, onCancel])

  const handleDone = useCallback(() => {
    onCancel()
  }, [onCancel])

  const handleHowToUse = useCallback(() => {
    if (view.type === 'confirmation') {
      setSelectedApp(null)
      setView({ type: 'howToUse', format: view.format })
    }
  }, [view])

  const handleBackToConfirmation = useCallback(() => {
    if (view.type === 'howToUse') {
      setView({ type: 'confirmation', format: view.format, wasDownload: true })
    }
  }, [view])

  // Scroll selected item into view
  const scrollToSelected = useCallback((index: number) => {
    const container = scrollContainerRef.current
    const item = itemRefs.current[index]
    if (!item || !container) return

    const isFirst = index === 0
    const isLast = index === EXPORT_FORMATS.length - 1

    if (isFirst) {
      // Scroll all the way to top so the top fade clears correctly
      container.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (isLast) {
      // Scroll all the way to bottom so the bottom fade clears correctly
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    } else {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  // Keyboard navigation (only in selecting state)
  useEffect(() => {
    if (view.type !== 'selecting') return

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
          if (selectedIndex < EXPORT_FORMATS.length - 1) {
            const newIndex = selectedIndex + 1
            setSelectedIndex(newIndex)
            scrollToSelected(newIndex)
          }
          break
        }
        case 'Enter':
          e.preventDefault()
          if (EXPORT_FORMATS[selectedIndex]) {
            handleExport(EXPORT_FORMATS[selectedIndex].value)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view.type, selectedIndex, handleExport, scrollToSelected])

  // Get compatible apps for How To Use view
  const compatibleApps = view.type === 'howToUse' 
    ? APP_INFO.filter(app => view.format.compatibleApps.includes(app.id))
    : []

  const getSelectedLabel = () => {
    if (!selectedApp) return 'Select your app...'
    if (selectedApp === 'other') return 'Other / Not listed'
    return selectedApp.name
  }

  // Render content based on current view
  const renderContent = () => {
    // How To Use view
    if (view.type === 'howToUse') {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="font-mono lowercase">
              how to use {view.format.label}
            </DialogTitle>
          </DialogHeader>

          <div className="pt-1">
            <p className="text-xs text-muted-foreground font-mono mb-2">
              What app are you importing to?
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between font-mono text-sm lowercase"
                >
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

          {/* Instructions for selected app */}
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

          {/* Other / Not listed instructions */}
          {selectedApp === 'other' && (
            <div className="bg-muted/50 rounded-md p-3 mt-2 mb-4 space-y-3">
              <div>
                <p className="text-xs font-mono font-medium mb-1">Check your software's documentation</p>
                <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                  Look for "import palette", "load swatches", or "color presets" in your app's 
                  help menu. The file extension ({view.format.extension}) can help you find the right import option.
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
            <Button
              variant="outline"
              className="flex-1 font-mono lowercase"
              onClick={handleBackToConfirmation}
            >
              back
            </Button>
            <Button
              className="flex-1 font-mono lowercase"
              onClick={handleDone}
            >
              done
            </Button>
          </div>
        </>
      )
    }

    // Confirmation view
    if (view.type === 'confirmation') {
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
              {view.wasDownload 
                ? 'Your palette has been downloaded!' 
                : 'Copied to clipboard!'}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {view.format.label} ({view.format.extension})
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 font-mono lowercase"
              onClick={handleHowToUse}
            >
              how to use
            </Button>
            <Button
              className="flex-1 font-mono lowercase"
              onClick={handleDone}
            >
              done
            </Button>
          </div>
        </>
      )
    }

    // Selecting view (default)
    return (
      <>
        <DialogHeader>
          <DialogTitle className="font-mono lowercase">export palette</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {/* Scroll up indicator */}
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
            {EXPORT_FORMATS.map((format, index) => (
              <Button
                key={format.value}
                ref={(el) => { itemRefs.current[index] = el }}
                variant="ghost"
                className={`w-full justify-between font-mono text-sm h-auto py-2.5 px-3 ${
                  selectedIndex === index ? 'ring-2 ring-ring bg-accent' : ''
                }`}
                onClick={() => handleExport(format.value)}
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
          </div>

          {/* Scroll down indicator */}
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

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

// Helper to get app names from IDs
function getAppNames(appIds: string[]): string {
  return appIds
    .map(id => {
      const app = APP_INFO.find(a => a.id === id)
      return app?.name || id
    })
    .join(', ')
}
