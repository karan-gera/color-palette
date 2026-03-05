import { CircleHelp } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import CVDToggle, { type CVDToggleHandle } from './CVDToggle'

type HeaderProps = {
  cvdRef: React.Ref<CVDToggleHandle>
  onToggleDocs: () => void
}

export default function Header({ cvdRef, onToggleDocs }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full max-w-4xl">
      <h1 className="text-4xl tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
        Palette<em style={{ fontStyle: 'italic', opacity: 0.65 }}>Port</em>
      </h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDocs}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <CircleHelp className="size-4" />
        </button>
        <CVDToggle ref={cvdRef} />
        <ThemeToggle />
      </div>
    </div>
  )
}
