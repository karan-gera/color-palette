import { useEffect, useRef, useState } from 'react'
import { type GradientStop } from '@/helpers/gradientGenerator'
import ColorPicker from './ColorPicker'

type PaletteEntry = {
  colorId: string
  hex: string
}

type StopColorPickerProps = {
  stop: GradientStop
  palette: PaletteEntry[]
  anchorPosition: number // 0–100, used to position popover left/right
  onPickPalette: (colorId: string, hex: string) => void
  onPickCustom: (hex: string) => void
  onClose: () => void
}

export default function StopColorPicker({
  stop,
  palette,
  anchorPosition,
  onPickPalette,
  onPickCustom,
  onClose,
}: StopColorPickerProps) {
  const [customHex, setCustomHex] = useState(stop.hex)
  const [hexError, setHexError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync hex input when stop.hex changes externally (slider or palette swatch)
  useEffect(() => {
    setCustomHex(stop.hex)
    setHexError(false)
  }, [stop.hex])

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleHexChange(value: string) {
    setCustomHex(value)
    const cleaned = value.startsWith('#') ? value : `#${value}`
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      setHexError(false)
      onPickCustom(cleaned.toLowerCase())
    } else {
      setHexError(value.length > 1) // only show error once user has typed something
    }
  }

  // Flip popover to the left if anchor is past 70%
  const alignLeft = anchorPosition > 70

  return (
    <div
      ref={containerRef}
      className={[
        'absolute top-14 z-50 w-64',
        'bg-background border border-border rounded-lg shadow-lg p-3',
        alignLeft ? 'right-0' : 'left-0',
      ].join(' ')}
    >
      {/* Palette swatches */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {palette.map(entry => {
          const isActive =
            stop.source.type === 'palette' && stop.source.colorId === entry.colorId
          return (
            <button
              key={entry.colorId}
              className={[
                'w-7 h-7 rounded-full border-2 transition-all duration-100',
                'hover:scale-110 cursor-pointer',
                isActive
                  ? 'border-foreground scale-110 shadow-sm'
                  : 'border-transparent hover:border-foreground/40',
              ].join(' ')}
              style={{ backgroundColor: entry.hex }}
              onClick={() => onPickPalette(entry.colorId, entry.hex)}
              aria-label={`pick ${entry.hex}`}
            />
          )
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-3" />

      {/* Hex input — live updating */}
      <label className="font-mono text-[10px] text-muted-foreground lowercase block mb-1">
        hex
      </label>
      <input
        type="text"
        value={customHex}
        maxLength={7}
        className={[
          'w-full font-mono text-xs px-2 py-1 rounded border bg-background text-foreground mb-3',
          'focus:outline-none focus:ring-1',
          hexError
            ? 'border-destructive focus:ring-destructive'
            : 'border-border focus:ring-foreground/30',
        ].join(' ')}
        onChange={e => handleHexChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose()
        }}
        placeholder="#000000"
        spellCheck={false}
      />
      {hexError && (
        <p className="font-mono text-[10px] text-destructive -mt-2 mb-2 lowercase">
          invalid hex
        </p>
      )}

      {/* HSL / OKLCH sliders */}
      <ColorPicker
        hex={stop.hex.slice(1)}
        fillChar="0"
        onChange={hex => onPickCustom('#' + hex)}
      />
    </div>
  )
}
