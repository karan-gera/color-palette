import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { hexLuminance } from '@/helpers/colorTheory'

type HeroProps = {
  color: string | null
  onClick: () => void
}

export default function Hero({ color, onClick }: HeroProps) {
  const textColor = useMemo(() => hexLuminance(color ?? '#ffffff') > 160 ? '#111111' : '#ffffff', [color])

  return (
    <button
      type="button"
      onClick={onClick}
      className="cvd-color size-[var(--circle-size)] rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out relative"
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
