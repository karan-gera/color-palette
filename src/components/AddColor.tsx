import { Plus } from 'lucide-react'

type AddColorProps = {
  onAdd: () => void
}

export default function AddColor({ onAdd }: AddColorProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="size-[var(--circle-size)] rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out bg-card hover:bg-accent"
      style={{
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))',
      }}
      aria-label="Add color"
    >
      <Plus className="size-16" strokeWidth={1.5} />
    </button>
  )
}
