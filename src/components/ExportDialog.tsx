import { useState, useEffect, useCallback } from 'react'
import { Copy, Download, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DialogKeyboardHints from './DialogKeyboardHints'
import { 
  CODE_FORMATS,
  ART_FORMATS,
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
}

const HINTS = [
  { key: '↑↓', label: 'select' },
  { key: 'Enter', label: 'export' },
  { key: 'Esc', label: 'cancel' },
]

export default function ExportDialog({ colors, onCancel }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'art'>('code')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null)

  // Get current list of formats based on tab and app selection
  const currentFormats = activeTab === 'code' 
    ? CODE_FORMATS 
    : selectedApp 
      ? ART_FORMATS.filter(f => f.compatibleApps.includes(selectedApp.id))
      : ART_FORMATS

  const handleExport = useCallback(async (format: ExportFormat) => {
    const formatInfo = [...CODE_FORMATS, ...ART_FORMATS].find(f => f.value === format)
    if (!formatInfo) return

    const content = await exportPalette(colors, format)
    
    if (formatInfo.isDownload) {
      downloadFile(content, `palette.${formatInfo.extension}`)
      setCopiedFormat(format)
      setTimeout(() => setCopiedFormat(null), 1500)
    } else {
      const success = await copyToClipboard(content as string)
      if (success) {
        setCopiedFormat(format)
        setTimeout(() => setCopiedFormat(null), 1500)
      }
    }
  }, [colors])

  const handleAppSelect = useCallback((app: AppInfo) => {
    setSelectedApp(app)
    setSelectedIndex(0)
  }, [])

  const clearAppSelection = useCallback(() => {
    setSelectedApp(null)
    setSelectedIndex(0)
  }, [])

  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedIndex(0)
    setSelectedApp(null)
  }, [activeTab])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : currentFormats.length - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < currentFormats.length - 1 ? prev + 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          if (currentFormats[selectedIndex]) {
            handleExport(currentFormats[selectedIndex].value)
          }
          break
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault()
            setActiveTab(prev => prev === 'code' ? 'art' : 'code')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, currentFormats, handleExport])

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono lowercase">export palette</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'code' | 'art')}>
          <TabsList className="w-full">
            <TabsTrigger value="code" className="flex-1 font-mono lowercase text-xs">
              for code
            </TabsTrigger>
            <TabsTrigger value="art" className="flex-1 font-mono lowercase text-xs">
              for art apps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4">
            <FormatList
              formats={CODE_FORMATS}
              selectedIndex={selectedIndex}
              copiedFormat={copiedFormat}
              onExport={handleExport}
              onSelect={setSelectedIndex}
            />
          </TabsContent>

          <TabsContent value="art" className="mt-4">
            {/* App Selection */}
            {!selectedApp && (
              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
                  select your app
                </p>
                <div className="flex flex-wrap gap-2">
                  {APP_INFO.map((app) => (
                    <Button
                      key={app.id}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs lowercase"
                      onClick={() => handleAppSelect(app)}
                    >
                      {app.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected App View */}
            {selectedApp && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm lowercase">{selectedApp.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-mono text-xs lowercase text-muted-foreground"
                    onClick={clearAppSelection}
                  >
                    change app
                  </Button>
                </div>

                {/* Import Instructions */}
                <div className="bg-muted/50 rounded-md p-3 mb-4">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">
                    how to import
                  </p>
                  <ol className="text-xs font-mono space-y-1">
                    {selectedApp.importSteps.map((step, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="text-foreground">{i + 1}.</span> {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Format separator for non-app view */}
            {!selectedApp && (
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-2 text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                    or choose format
                  </span>
                </div>
              </div>
            )}

            {/* Format List */}
            <FormatList
              formats={currentFormats}
              selectedIndex={selectedIndex}
              copiedFormat={copiedFormat}
              onExport={handleExport}
              onSelect={setSelectedIndex}
              showCompatibility={!selectedApp}
            />
          </TabsContent>
        </Tabs>

        <p className="text-[10px] text-muted-foreground font-mono text-center px-4 py-2 border-t">
          Can't find your format? Click any color's hex code to copy it individually.
        </p>

        <DialogKeyboardHints hints={HINTS} />
      </DialogContent>
    </Dialog>
  )
}

// Format list component
type FormatListProps = {
  formats: ExportFormatInfo[]
  selectedIndex: number
  copiedFormat: ExportFormat | null
  onExport: (format: ExportFormat) => void
  onSelect: (index: number) => void
  showCompatibility?: boolean
}

function FormatList({ 
  formats, 
  selectedIndex, 
  copiedFormat, 
  onExport, 
  onSelect,
  showCompatibility = false,
}: FormatListProps) {
  return (
    <div className="grid gap-1 max-h-[300px] overflow-y-auto py-1">
      {formats.map((format, index) => (
        <Button
          key={format.value}
          variant="ghost"
          className={`w-full justify-between font-mono text-sm h-auto py-3 px-3 ${
            selectedIndex === index ? 'ring-2 ring-ring bg-accent' : ''
          }`}
          onClick={() => onExport(format.value)}
          onMouseEnter={() => onSelect(index)}
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="lowercase">{format.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {format.description}
              {showCompatibility && format.compatibleApps.length > 0 && (
                <span className="ml-1 opacity-70">
                  — {getAppNames(format.compatibleApps)}
                </span>
              )}
            </span>
          </div>
          {copiedFormat === format.value ? (
            <Check className="size-4 text-green-500" />
          ) : format.isDownload ? (
            <Download className="size-4 opacity-50" />
          ) : (
            <Copy className="size-4 opacity-50" />
          )}
        </Button>
      ))}
    </div>
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
