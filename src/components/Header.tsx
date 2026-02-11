import { CircleHelp } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import CVDToggle from './CVDToggle'

type HeaderProps = {
  title: string
  onCycleCVD: React.MutableRefObject<(() => void) | null>
  onToggleDocs: () => void
}

export default function Header({ title, onCycleCVD, onToggleDocs }: HeaderProps) {
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
        <CVDToggle onCycleCVD={onCycleCVD} />
        <ThemeToggle />
      </div>
    </div>
  )
}
