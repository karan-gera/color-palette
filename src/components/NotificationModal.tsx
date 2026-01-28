import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type NotificationModalProps = {
  message: string
  onClose: () => void
}

export default function NotificationModal({ message, onClose }: NotificationModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <div className="text-center py-2">
          <p className="font-mono text-sm leading-relaxed">{message}</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="font-mono lowercase">
            ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
