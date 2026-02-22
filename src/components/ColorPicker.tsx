import { useEffect, useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { hexToHsl, hslToHex, hexToOklch, oklchToHex, clamp } from '@/helpers/colorTheory'

type ColorPickerProps = {
  hex: string // 6 hex digits, no #
  fillChar: string
  onChange: (hex: string) => void
}

type ColorMode = 'hsl' | 'oklch'

const SLIDER_CLASS =
  '[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-track]]:[background:var(--track-bg)] [&_[data-slot=slider-range]]:hidden'

export default function ColorPicker({ hex, fillChar, onChange }: ColorPickerProps) {
  const fullHex = '#' + hex.padEnd(6, fillChar)
  const [mode, setMode] = useState<ColorMode>('hsl')
  const [hsl, setHsl] = useState(() => hexToHsl(fullHex))
  const [oklch, setOklch] = useState(() => hexToOklch(fullHex))
  const lastSliderHexRef = useRef<string | null>(null)

  // Sync from external hex changes (user typing)
  useEffect(() => {
    const current = '#' + hex.padEnd(6, fillChar)
    if (current === lastSliderHexRef.current) return
    lastSliderHexRef.current = null
    setHsl(hexToHsl(current))
    setOklch(hexToOklch(current))
  }, [hex, fillChar])

  const handleHslChange = (key: 'h' | 's' | 'l', value: number) => {
    const next = { ...hsl, [key]: value }
    setHsl(next)
    const newHex = hslToHex(next)
    lastSliderHexRef.current = newHex
    setOklch(hexToOklch(newHex))
    onChange(newHex.replace('#', ''))
  }

  const handleOklchChange = (key: 'l' | 'c' | 'h', value: number) => {
    const next = { ...oklch, [key]: value }
    setOklch(next)
    const newHex = oklchToHex(next)
    lastSliderHexRef.current = newHex
    setHsl(hexToHsl(newHex))
    onChange(newHex.replace('#', ''))
  }

  // HSL values
  const h = Math.round(hsl.h)
  const s = Math.round(hsl.s)
  const l = Math.round(hsl.l)

  // Oklch values
  const okL = Math.round(oklch.l)
  const okC = oklch.c
  const okH = Math.round(oklch.h)

  // HSL gradients
  const hGradient =
    'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))'
  const sGradient = `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`
  const lGradient = `linear-gradient(to right, hsl(${h},${s}%,0%), hsl(${h},${s}%,50%), hsl(${h},${s}%,100%))`

  // Oklch gradients (using CSS oklch())
  const okLGradient = `linear-gradient(to right, oklch(0% ${okC} ${okH}), oklch(50% ${okC} ${okH}), oklch(100% ${okC} ${okH}))`
  const okCGradient = `linear-gradient(to right, oklch(${okL}% 0 ${okH}), oklch(${okL}% 0.15 ${okH}), oklch(${okL}% 0.3 ${okH}))`
  const okHGradient =
    'linear-gradient(to right, oklch(65% 0.2 0), oklch(65% 0.2 60), oklch(65% 0.2 120), oklch(65% 0.2 180), oklch(65% 0.2 240), oklch(65% 0.2 300), oklch(65% 0.2 360))'

  const hslSliders: { key: 'h' | 's' | 'l'; max: number; value: number; gradient: string; label: string; suffix: string }[] = [
    { key: 'h', max: 360, value: h, gradient: hGradient, label: 'h', suffix: '°' },
    { key: 's', max: 100, value: s, gradient: sGradient, label: 's', suffix: '%' },
    { key: 'l', max: 100, value: l, gradient: lGradient, label: 'l', suffix: '%' },
  ]

  // Chroma slider: 0-0.4 mapped to 0-40 for display, step 0.01
  const chromaDisplayValue = Math.round(okC * 100)
  const oklchSliders: { key: 'l' | 'c' | 'h'; max: number; step: number; value: number; displayValue: string; gradient: string; label: string; suffix: string }[] = [
    { key: 'l', max: 100, step: 1, value: okL, displayValue: String(okL), gradient: okLGradient, label: 'l', suffix: '%' },
    { key: 'c', max: 40, step: 1, value: chromaDisplayValue, displayValue: String(chromaDisplayValue), gradient: okCGradient, label: 'c', suffix: '' },
    { key: 'h', max: 360, step: 1, value: okH, displayValue: String(okH), gradient: okHGradient, label: 'h', suffix: '°' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && setMode(v as ColorMode)}
        variant="outline"
        size="sm"
        className="justify-start"
      >
        <ToggleGroupItem value="hsl" className="font-mono text-[10px] lowercase px-2">
          hsl
        </ToggleGroupItem>
        <ToggleGroupItem value="oklch" className="font-mono text-[10px] lowercase px-2">
          oklch
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === 'hsl' ? (
        <>
          {hslSliders.map(({ key, max, value, gradient, label, suffix }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-2 shrink-0">{label}</span>
              <Slider
                value={[value]}
                min={0}
                max={max}
                step={1}
                onValueChange={(vals) => handleHslChange(key, vals[0]!)}
                className={SLIDER_CLASS}
                style={{ '--track-bg': gradient } as React.CSSProperties}
              />
              <span className="font-mono text-[10px] text-muted-foreground w-7 text-right shrink-0 tabular-nums">
                {value}{suffix}
              </span>
            </div>
          ))}
        </>
      ) : (
        <>
          {oklchSliders.map(({ key, max, step, value, displayValue, gradient, label, suffix }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground w-2 shrink-0">{label}</span>
              <Slider
                value={[value]}
                min={0}
                max={max}
                step={step}
                onValueChange={(vals) => {
                  if (key === 'c') {
                    // Convert display value (0-40) back to actual chroma (0-0.4)
                    handleOklchChange(key, clamp(vals[0]! / 100, 0, 0.4))
                  } else {
                    handleOklchChange(key, vals[0]!)
                  }
                }}
                className={SLIDER_CLASS}
                style={{ '--track-bg': gradient } as React.CSSProperties}
              />
              <span className="font-mono text-[10px] text-muted-foreground w-7 text-right shrink-0 tabular-nums">
                {displayValue}{suffix}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
