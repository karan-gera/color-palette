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

type EditColorDialogProps = {
  initial: string
  onCancel: () => void
  onSave: (value: string) => void
}

export default function EditColorDialog({ initial, onCancel, onSave }: EditColorDialogProps) {
  const [value, setValue] = useState<string>(initial)

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
                className="size-10 rounded-md border-2 border-dashed shrink-0"
                style={{ backgroundColor: value }}
              />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="#rrggbb"
                className="font-mono"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="font-mono lowercase">
            cancel
          </Button>
          <Button onClick={() => onSave(value)} className="font-mono lowercase">
            save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
