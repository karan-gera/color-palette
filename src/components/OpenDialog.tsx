import { useEffect, useState, useRef, useCallback } from 'react'
import { useListKeyboardNav } from '@/hooks/useListKeyboardNav'
import { Trash2, Download, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import DialogKeyboardHints from './DialogKeyboardHints'
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

const HINTS = [
  { key: '↑↓', label: 'navigate' },
  { key: 'Enter', label: 'load' },
  { key: 'Del', label: 'delete' },
  { key: 'Esc', label: 'close' },
]

const EMPTY_HINTS = [
  { key: 'Esc', label: 'close' },
]

export default function OpenDialog({ palettes, onCancel, onSelect, onRemove, onPalettesUpdated }: OpenDialogProps) {
  const [list, setList] = useState<SavedPalette[]>(palettes)
  const [fading, setFading] = useState<Record<string, boolean>>({})
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const { selectedIndex, setSelectedIndex } = useListKeyboardNav({
    count: list.length,
    onEnter: (i) => { if (list[i]) onSelect(list[i].id) },
    onDelete: (i) => { if (list[i]) handleDelete(list[i].id, i) },
    enabled: !showNotification,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setList(palettes)
    setSelectedIndex(0)
  }, [palettes])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && list.length > 0) {
      const items = listRef.current.querySelectorAll('[data-palette-item]')
      const selectedItem = items[selectedIndex] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, list.length])

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

  const handleDelete = useCallback((id: string, index: number) => {
    setFading((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      onRemove(id)
      setList((prev) => {
        const newList = prev.filter((x) => x.id !== id)
        // Adjust selected index if needed
        if (index >= newList.length && newList.length > 0) {
          setSelectedIndex(newList.length - 1)
        }
        return newList
      })
    }, 200)
  }, [onRemove])



  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono lowercase">open palette</DialogTitle>
          </DialogHeader>
          
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto -mx-2 px-2 py-1">
            {list.length === 0 ? (
              <p className="text-muted-foreground text-sm font-mono text-center py-8">
                no saved palettes
              </p>
            ) : (
              <div className="grid gap-2 py-1">
                {list.map((p, index) => (
                  <div
                    key={p.id}
                    data-palette-item
                    onClick={() => setSelectedIndex(index)}
                    onDoubleClick={() => onSelect(p.id)}
                    className={`flex items-center justify-between gap-3 p-3 rounded-md border bg-card transition-all duration-200 cursor-pointer ${
                      fading[p.id] ? 'opacity-0' : 'opacity-100'
                    } ${
                      index === selectedIndex 
                        ? 'ring-2 ring-ring border-ring' 
                        : 'hover:border-muted-foreground/50'
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
                            className="cvd-color size-5 rounded-sm border"
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
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(p.id)
                        }}
                        className="font-mono lowercase"
                      >
                        load
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(p.id, index)
                        }}
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

          <DialogKeyboardHints hints={list.length > 0 ? HINTS : EMPTY_HINTS} />

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
