import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Download, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GradientStopBar from './GradientStopBar'
import StopColorPicker from './StopColorPicker'
import { generateLinearGradientCSS, type LinearGradientConfig } from '@/helpers/gradientGenerator'
import { type UseGradientStopsReturn } from '@/hooks/useGradientStops'

type GradientViewProps = {
  palette: string[]         // current palette hex values (same order as colorIds)
  colorIds: string[]        // stable IDs for each palette color
  gradientState: UseGradientStopsReturn
  onOpenExport: () => void
  gradientNeedsRefresh: boolean
  onRedrawGradient: () => void
  onDismissRefresh: () => void
  previewRatio: number
  onPreviewRatioChange: (ratio: number) => void
}

export default function GradientView({
  palette,
  colorIds,
  gradientState,
  onOpenExport,
  gradientNeedsRefresh,
  onRedrawGradient,
  onDismissRefresh,
  previewRatio,
  onPreviewRatioChange,
}: GradientViewProps) {
  const {
    stops,
    angle,
    addStop,
    removeStop,
    moveStop,
    setStopColor,
    setAngle,
  } = gradientState

  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)

  const ASPECT_RATIOS = [
    { label: '16:9', ratio: 16 / 9 },
    { label: '4:3',  ratio: 4 / 3 },
    { label: '1:1',  ratio: 1 },
    { label: '4:5',  ratio: 4 / 5 },
    { label: '9:16', ratio: 9 / 16 },
  ] as const

  const paletteEntries = useMemo(
    () => palette.map((hex, i) => ({ colorId: colorIds[i], hex })),
    [palette, colorIds],
  )

  const config: LinearGradientConfig = useMemo(
    () => ({ type: 'linear', angle, stops }),
    [angle, stops],
  )

  const gradientCSS = useMemo(() => generateLinearGradientCSS(config), [config])

  const selectedStop = stops.find(s => s.id === selectedStopId) ?? null

  // When adding from the bar, pick a sensible default color from the palette
  const handleAddStop = useCallback(
    (position: number) => {
      const entry = paletteEntries[0]
      if (!entry) return
      addStop(position, { type: 'palette', colorId: entry.colorId, hex: entry.hex })
    },
    [addStop, paletteEntries],
  )

  const handleSelectStop = useCallback((id: string) => {
    setSelectedStopId((prev: string | null) => (prev === id ? prev : id))
  }, [])

  const handleDragStart = useCallback(() => {
    setSelectedStopId(null)
  }, [])

  const handlePickPalette = useCallback(
    (colorId: string, hex: string) => {
      if (!selectedStopId) return
      setStopColor(selectedStopId, { type: 'palette', colorId, hex })
    },
    [selectedStopId, setStopColor],
  )

  const handlePickCustom = useCallback(
    (hex: string) => {
      if (!selectedStopId) return
      setStopColor(selectedStopId, { type: 'custom', hex })
    },
    [selectedStopId, setStopColor],
  )

  const handleAngleInput = useCallback(
    (raw: string) => {
      const n = parseInt(raw, 10)
      if (!isNaN(n)) setAngle(n)
    },
    [setAngle],
  )

  return (
    <div className="flex flex-col gap-4 w-full px-8 py-6">
      {/* Palette-changed refresh banner */}
      {gradientNeedsRefresh && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <span className="font-mono text-xs text-foreground/70 lowercase">
            palette has changed — redraw the gradient?
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="font-mono lowercase text-xs h-7 px-2"
              onClick={onRedrawGradient}
            >
              redraw
            </Button>
            <button
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors lowercase"
              onClick={onDismissRefresh}
            >
              dismiss
            </button>
          </div>
        </div>
      )}

      {/* Aspect ratio toggle */}
      <div className="flex items-center gap-3 justify-end">
        {ASPECT_RATIOS.map(({ label, ratio }) => (
          <button
            key={label}
            onClick={() => onPreviewRatioChange(ratio)}
            className={[
              'font-mono text-[10px] transition-colors lowercase',
              previewRatio === ratio
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Large gradient preview — height anchored to 16:9, width varies per ratio */}
      <div className="w-full relative" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            layout
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="cvd-color h-full rounded-xl border border-border"
            style={{ aspectRatio: String(previewRatio), background: gradientCSS }}
          />
        </div>
      </div>

      {/* Stop bar + picker */}
      <div className="relative">
        <GradientStopBar
          stops={stops}
          selectedStopId={selectedStopId}
          onAddStop={handleAddStop}
          onMoveStop={moveStop}
          onRemoveStop={removeStop}
          onSelectStop={handleSelectStop}
          onDragStart={handleDragStart}
        />

        {/* Color picker anchored to selected stop */}
        {selectedStop && (
          <div
            className="absolute top-0 w-full pointer-events-none"
            style={{ left: 0 }}
          >
            <div
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                left: `${selectedStop.position}%`,
                top: 0,
              }}
            >
              <StopColorPicker
                stop={selectedStop}
                palette={paletteEntries}
                anchorPosition={selectedStop.position}
                onPickPalette={handlePickPalette}
                onPickCustom={handlePickCustom}
                onClose={() => setSelectedStopId(null)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Angle control */}
      <div className="flex items-center gap-4">
        <label className="font-mono text-xs text-muted-foreground lowercase w-10 shrink-0">
          angle
        </label>
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={e => setAngle(Number(e.target.value))}
          className="flex-1 accent-foreground"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAngle(angle - 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-border font-mono text-sm leading-none text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="decrease angle"
          >
            −
          </button>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={360}
              value={angle}
              onChange={e => handleAngleInput(e.target.value)}
              className="w-14 font-mono text-xs pl-2 pr-5 py-1 rounded border border-border bg-background text-foreground text-right focus:outline-none focus:ring-1 focus:ring-foreground/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground pointer-events-none select-none">°</span>
          </div>
          <button
            onClick={() => setAngle(angle + 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-border font-mono text-sm leading-none text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            aria-label="increase angle"
          >
            +
          </button>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="font-mono lowercase text-xs gap-1.5"
          onClick={onRedrawGradient}
        >
          <RotateCcw size={12} />
          reset to palette
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="font-mono lowercase text-xs gap-1.5 ml-auto"
          onClick={onOpenExport}
        >
          <Download size={12} />
          export
        </Button>
      </div>
    </div>
  )
}
