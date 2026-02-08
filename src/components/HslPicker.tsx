import { useEffect, useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { hexToHsl, hslToHex } from '@/helpers/colorTheory'

type HslPickerProps = {
  hex: string // 6 hex digits, no #
  fillChar: string
  onChange: (hex: string) => void
}

const SLIDER_CLASS =
  '[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:[background:var(--track-bg)] [&_[data-slot=slider-range]]:hidden'

export default function HslPicker({ hex, fillChar, onChange }: HslPickerProps) {
  const fullHex = '#' + hex.padEnd(6, fillChar)
  const [hsl, setHsl] = useState(() => hexToHsl(fullHex))
  const lastSliderHexRef = useRef<string | null>(null)

  // Sync from external hex changes (user typing)
  useEffect(() => {
    const current = '#' + hex.padEnd(6, fillChar)
    if (current === lastSliderHexRef.current) return
    lastSliderHexRef.current = null
    setHsl(hexToHsl(current))
  }, [hex, fillChar])

  const handleChange = (key: 'h' | 's' | 'l', value: number) => {
    const next = { ...hsl, [key]: value }
    setHsl(next)
    const newHex = hslToHex(next)
    lastSliderHexRef.current = newHex
    onChange(newHex.replace('#', ''))
  }

  const h = Math.round(hsl.h)
  const s = Math.round(hsl.s)
  const l = Math.round(hsl.l)

  const hGradient =
    'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'
  const sGradient = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`
  const lGradient = `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`

  const sliders: { key: 'h' | 's' | 'l'; max: number; value: number; gradient: string; label: string; suffix: string }[] = [
    { key: 'h', max: 360, value: h, gradient: hGradient, label: 'h', suffix: '°' },
    { key: 's', max: 100, value: s, gradient: sGradient, label: 's', suffix: '%' },
    { key: 'l', max: 100, value: l, gradient: lGradient, label: 'l', suffix: '%' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {sliders.map(({ key, max, value, gradient, label, suffix }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground w-2 shrink-0">{label}</span>
          <Slider
            value={[value]}
            min={0}
            max={max}
            step={1}
            onValueChange={(vals) => handleChange(key, vals[0]!)}
            className={SLIDER_CLASS}
            style={{ '--track-bg': gradient } as React.CSSProperties}
          />
          <span className="font-mono text-[10px] text-muted-foreground w-7 text-right shrink-0 tabular-nums">
            {value}{suffix}
          </span>
        </div>
      ))}
    </div>
  )
}
