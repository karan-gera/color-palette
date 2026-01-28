import { useMemo } from 'react'
import { Plus } from 'lucide-react'

type HeroProps = {
  color: string | null
  onClick: () => void
}

export default function Hero({ color, onClick }: HeroProps) {
  const textColor = useMemo(() => {
    const bg = (color ?? '#ffffff').replace('#', '')
    const r = parseInt(bg.substring(0, 2), 16)
    const g = parseInt(bg.substring(2, 4), 16)
    const b = parseInt(bg.substring(4, 6), 16)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 160 ? '#111111' : '#ffffff'
  }, [color])

  return (
    <button
      type="button"
      onClick={onClick}
      className="size-[200px] rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out relative"
      style={{
        backgroundColor: color ?? '#ffffff',
        borderColor: textColor,
        color: textColor,
      }}
      aria-label="Generate color"
    >
      <Plus className="size-16" strokeWidth={1.5} />
    </button>
  )
}
