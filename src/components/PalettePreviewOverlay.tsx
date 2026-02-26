import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'

type PreviewMode = 'mosaic' | 'ui' | 'title'

type PalettePreviewOverlayProps = {
  palette: string[]
  onClose: () => void
}

const MODES: Array<{ id: PreviewMode; label: string }> = [
  { id: 'mosaic',  label: 'mosaic'      },
  { id: 'ui',     label: 'ui elements' },
  { id: 'title',  label: 'title design' },
]

function MosaicPlaceholder({ palette }: { palette: string[] }) {
  if (palette.length === 0) return null
  // TODO: replace with Canvas-generated geometric composition
  return (
    <div className="w-full h-full flex items-stretch">
      {palette.map((hex, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
      ))}
    </div>
  )
}

function UIPlaceholder({ palette }: { palette: string[] }) {
  const [bg, primary, secondary, accent] = [
    palette[palette.length - 1] ?? '#ffffff',
    palette[0] ?? '#000000',
    palette[1] ?? '#333333',
    palette[2] ?? '#666666',
  ]
  // TODO: replace with real UI mockup templates
  return (
    <div className="w-full h-full flex items-center justify-center p-12" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: secondary }}>
        <div className="h-14 px-5 flex items-center gap-3" style={{ backgroundColor: primary }}>
          <div className="size-2 rounded-full bg-white/40" />
          <div className="h-2 w-24 rounded-full bg-white/40" />
          <div className="ml-auto h-7 w-16 rounded-md bg-white/20" />
        </div>
        <div className="p-5 space-y-3">
          <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: accent, opacity: 0.6 }} />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-5/6 rounded-full bg-white/10" />
          <div className="h-2 w-2/3 rounded-full bg-white/10" />
          <div className="h-9 w-full rounded-lg mt-4" style={{ backgroundColor: primary, opacity: 0.85 }} />
        </div>
      </div>
    </div>
  )
}

function TitlePlaceholder({ palette }: { palette: string[] }) {
  const [bg, fg, accent] = [
    palette[palette.length - 1] ?? '#ffffff',
    palette[0] ?? '#000000',
    palette[1] ?? '#333333',
  ]
  // TODO: replace with real typography layout templates
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-12" style={{ backgroundColor: bg }}>
      <div className="font-mono text-7xl font-bold tracking-tight" style={{ color: fg }}>
        palette
      </div>
      <div className="font-mono text-2xl tracking-widest" style={{ color: accent }}>
        color system
      </div>
      <div className="flex gap-2 mt-4">
        {palette.map((hex, i) => (
          <div key={i} className="size-3 rounded-full" style={{ backgroundColor: hex }} />
        ))}
      </div>
    </div>
  )
}

export default function PalettePreviewOverlay({ palette, onClose }: PalettePreviewOverlayProps) {
  const [mode, setMode] = useState<PreviewMode>('mosaic')

  return (
    <div className="fixed inset-0 z-[9997] bg-background flex flex-col" onClick={onClose}>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'mosaic'  && <MosaicPlaceholder  palette={palette} />}
        {mode === 'ui'      && <UIPlaceholder      palette={palette} />}
        {mode === 'title'   && <TitlePlaceholder   palette={palette} />}
      </div>

      {/* Bottom bar — stop click propagation so it doesn't close the overlay */}
      <div
        className="shrink-0 h-14 flex items-center justify-between px-6 border-t border-border/50 bg-background/80 backdrop-blur-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Mode switcher */}
        <div className="flex items-center gap-1">
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={[
                'font-mono text-xs px-3 py-1.5 rounded-md transition-colors duration-150 lowercase',
                mode === m.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
              ].join(' ')}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* TODO: regenerate button (for mosaic randomization) */}
          <button
            type="button"
            onClick={() => {/* TODO: regenerate */}}
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-foreground/5"
          >
            <RefreshCw className="size-3" />
            regenerate
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-foreground/5"
            aria-label="close preview"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
