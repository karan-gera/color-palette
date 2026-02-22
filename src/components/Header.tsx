import { CircleHelp } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import CVDToggle, { type CVDToggleHandle } from './CVDToggle'

type HeaderProps = {
  title: string
  cvdRef: React.Ref<CVDToggleHandle>
  onToggleDocs: () => void
}

export default function Header({ title, cvdRef, onToggleDocs }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full max-w-2xl">
      <h1 className="text-2xl font-medium tracking-tight lowercase">{title}</h1>
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
