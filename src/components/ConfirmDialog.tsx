import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'

type ConfirmDialogProps = {
  open: boolean
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <div className="text-center py-2">
          <p className="font-mono text-sm leading-relaxed">{message}</p>
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={onCancel} className="font-mono lowercase">
            cancel
          </Button>
          <Button onClick={onConfirm} className="font-mono lowercase">
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
