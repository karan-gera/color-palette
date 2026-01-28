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

type SaveDialogProps = {
  defaultName?: string
  onCancel: () => void
  onSave: (name?: string) => void
}

const HINTS = [
  { key: 'Enter', label: 'save' },
  { key: 'Esc', label: 'cancel' },
]

export default function SaveDialog({ defaultName, onCancel, onSave }: SaveDialogProps) {
  const [nameValue, setNameValue] = useState(defaultName ?? '')

  const handleSave = useCallback(() => {
    onSave(nameValue || undefined)
  }, [nameValue, onSave])

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
          <DialogTitle className="font-mono lowercase">save palette</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <label className="text-sm font-mono lowercase">name</label>
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              placeholder="optional"
              className="font-mono"
              autoFocus
            />
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
