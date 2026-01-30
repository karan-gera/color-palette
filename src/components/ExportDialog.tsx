import { useState, useEffect, useCallback } from 'react'
import { Copy, Download, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import DialogKeyboardHints from './DialogKeyboardHints'
import { 
  EXPORT_FORMATS, 
  exportPalette, 
  copyToClipboard, 
  downloadFile,
  type ExportFormat 
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
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null)

  const handleExport = useCallback(async (format: ExportFormat) => {
    const formatInfo = EXPORT_FORMATS.find(f => f.value === format)
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : EXPORT_FORMATS.length - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < EXPORT_FORMATS.length - 1 ? prev + 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          handleExport(EXPORT_FORMATS[selectedIndex].value)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, handleExport])

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono lowercase">export palette</DialogTitle>
        </DialogHeader>
        
        <div className="py-1">
          <div className="grid gap-1">
            {EXPORT_FORMATS.map((format, index) => (
              <Button
                key={format.value}
                variant="ghost"
                className={`w-full justify-between font-mono text-sm h-auto py-3 px-3 ${
                  selectedIndex === index ? 'ring-2 ring-ring bg-accent' : ''
                }`}
                onClick={() => handleExport(format.value)}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="lowercase">{format.label}</span>
                  <span className="text-[10px] text-muted-foreground">{format.description}</span>
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
        </div>

        <p className="text-[10px] text-muted-foreground font-mono text-center px-4 py-2 border-t">
          Can't find your format? Click any color's hex code to copy it individually.
        </p>

        <DialogKeyboardHints hints={HINTS} />
      </DialogContent>
    </Dialog>
  )
}
