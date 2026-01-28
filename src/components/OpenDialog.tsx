import { useEffect, useState, useRef } from 'react'
import { Trash2, Download, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import NotificationModal from './NotificationModal'
import type { SavedPalette } from '@/helpers/storage'
import { exportAllPalettes, importPalettesFromFile, mergePalettes } from '@/helpers/storage'

type OpenDialogProps = {
  palettes: SavedPalette[]
  onCancel: () => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onPalettesUpdated: () => void
}

export default function OpenDialog({ palettes, onCancel, onSelect, onRemove, onPalettesUpdated }: OpenDialogProps) {
  const [list, setList] = useState<SavedPalette[]>(palettes)
  const [fading, setFading] = useState<Record<string, boolean>>({})
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setList(palettes)
  }, [palettes])

  const handleExportAll = () => {
    exportAllPalettes()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedPalettes = await importPalettesFromFile(file)
      const result = mergePalettes(importedPalettes)
      onPalettesUpdated()
      
      let message = 'Palettes imported successfully!'
      if (result.duplicates > 0) {
        message += ` (${result.duplicates} duplicate${result.duplicates > 1 ? 's' : ''} skipped)`
      }
      
      setNotificationMessage(message)
      setShowNotification(true)
    } catch (error) {
      setNotificationMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setShowNotification(true)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDelete = (id: string) => {
    setFading((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      onRemove(id)
      setList((prev) => prev.filter((x) => x.id !== id))
    }, 200)
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono lowercase">open palette</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
            {list.length === 0 ? (
              <p className="text-muted-foreground text-sm font-mono text-center py-8">
                no saved palettes
              </p>
            ) : (
              <div className="grid gap-2">
                {list.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md border bg-card transition-opacity duration-200 ${
                      fading[p.id] ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(p.savedAt).toLocaleString()}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {p.colors.map((color, i) => (
                          <div
                            key={i}
                            className="size-5 rounded-sm border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelect(p.id)}
                        className="font-mono lowercase"
                      >
                        load
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleDelete(p.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-2">
            <div className="flex w-full justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAll}
                  className="font-mono lowercase"
                >
                  <Download className="size-4" />
                  export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportClick}
                  className="font-mono lowercase"
                >
                  <Upload className="size-4" />
                  import
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="font-mono lowercase"
              >
                close
              </Button>
            </div>
          </DialogFooter>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </DialogContent>
      </Dialog>

      {showNotification && (
        <NotificationModal
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  )
}
