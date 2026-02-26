import { motion } from 'framer-motion'
import { X } from 'lucide-react'

type GradientPreviewOverlayProps = {
  onClose: () => void
}

export default function GradientPreviewOverlay({ onClose }: GradientPreviewOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[9997] bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      {/* Content area — placeholder until modes are implemented */}
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground lowercase">
          gradient preview — coming soon
        </p>
      </div>

      {/* Bottom bar */}
      <div
        className="shrink-0 h-14 flex items-center justify-end px-6 border-t border-border/50 bg-background/80 backdrop-blur-sm"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-foreground/5"
          aria-label="close preview"
        >
          <X className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}
