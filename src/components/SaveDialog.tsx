import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SaveDialogProps = {
  defaultName?: string
  onCancel: () => void
  onSave: (name?: string) => void
}

export default function SaveDialog({ defaultName, onCancel, onSave }: SaveDialogProps) {
  const [nameValue, setNameValue] = useState(defaultName ?? '')

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
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="font-mono lowercase">
            cancel
          </Button>
          <Button onClick={() => onSave(nameValue || undefined)} className="font-mono lowercase">
            save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
