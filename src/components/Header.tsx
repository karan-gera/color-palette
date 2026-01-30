import ThemeToggle from './ThemeToggle'
import CVDToggle from './CVDToggle'

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 w-full max-w-2xl">
      <h1 className="text-2xl font-medium tracking-tight lowercase">{title}</h1>
      <div className="flex items-center gap-2">
        <CVDToggle />
        <ThemeToggle />
      </div>
    </div>
  )
}
