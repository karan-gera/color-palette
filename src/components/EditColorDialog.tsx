import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DialogKeyboardHints from './DialogKeyboardHints'

type EditColorDialogProps = {
  initial: string
  onCancel: () => void
  onSave: (value: string) => void
}

const HINTS = [
  { key: 'Enter', label: 'save' },
  { key: 'Esc', label: 'cancel' },
]

export default function EditColorDialog({ initial, onCancel, onSave }: EditColorDialogProps) {
  const [value, setValue] = useState<string>(initial)

  const handleSave = useCallback(() => {
    onSave(value)
  }, [value, onSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono lowercase">edit color</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-mono lowercase">hex</label>
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-md border-2 border-dashed shrink-0 transition-colors duration-200"
                style={{ backgroundColor: value }}
              />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="#rrggbb"
                className="font-mono"
                autoFocus
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="font-mono lowercase">
            cancel
          </Button>
          <Button onClick={handleSave} className="font-mono lowercase">
            save
          </Button>
        </DialogFooter>
        <DialogKeyboardHints hints={HINTS} />
      </DialogContent>
    </Dialog>
  )
}
