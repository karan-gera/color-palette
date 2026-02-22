import { useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { type GradientStop } from '@/helpers/gradientGenerator'

type GradientStopBarProps = {
  stops: GradientStop[]
  selectedStopId: string | null
  onAddStop: (position: number) => void
  onMoveStop: (id: string, newPosition: number) => void
  onRemoveStop: (id: string) => void
  onSelectStop: (id: string) => void
  onDragStart?: () => void
}

export default function GradientStopBar({
  stops,
  selectedStopId,
  onAddStop,
  onMoveStop,
  onRemoveStop,
  onSelectStop,
  onDragStart,
}: GradientStopBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<{ id: string; startX: number; startPos: number } | null>(null)
  // Tracks whether the pointer moved enough to count as a drag (vs. a click)
  const didDragRef = useRef(false)

  // Convert a clientX to a 0–100 position relative to the bar
  const clientXToPosition = useCallback((clientX: number): number => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    const raw = ((clientX - rect.left) / rect.width) * 100
    return Math.max(0, Math.min(100, Math.round(raw)))
  }, [])

  // Click on the bar background → add stop
  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only trigger if the click target is the bar or gradient preview (not a handle)
      if ((e.target as HTMLElement).closest('[data-stop-handle]')) return
      const position = clientXToPosition(e.clientX)
      onAddStop(position)
    },
    [clientXToPosition, onAddStop],
  )

  // Pointer events for dragging a stop handle
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, stop: GradientStop) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      didDragRef.current = false
      draggingRef.current = {
        id: stop.id,
        startX: e.clientX,
        startPos: stop.position,
      }
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!draggingRef.current) return
      // Detect drag threshold — if exceeded, suppress the upcoming click
      if (!didDragRef.current && Math.abs(e.clientX - draggingRef.current.startX) > 4) {
        didDragRef.current = true
        onDragStart?.()
      }
      const newPos = clientXToPosition(e.clientX)
      onMoveStop(draggingRef.current.id, newPos)
    },
    [clientXToPosition, onMoveStop, onDragStart],
  )

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  const canRemove = stops.length > 2

  // Always horizontal — this bar is a source of truth, not a preview of the angle
  const barGradient = `linear-gradient(to right, ${[...stops]
    .sort((a, b) => a.position - b.position)
    .map(s => `${s.hex} ${s.position}%`)
    .join(', ')})`

  return (
    <div className="w-full select-none">
      {/* Gradient preview bar — clickable to add stops */}
      <div
        ref={barRef}
        className="cvd-color relative w-full h-10 rounded-lg cursor-crosshair"
        style={{ background: barGradient }}
        onClick={handleBarClick}
      />

      {/* Stop handles row */}
      <div className="relative w-full h-16 mt-1">
        {stops.map(stop => {
          const isSelected = stop.id === selectedStopId
          return (
            <div
              key={stop.id}
              data-stop-handle
              className="absolute -translate-x-1/2 group"
              style={{ left: `${stop.position}%` }}
            >
              {/* X delete button — appears on group hover, below the handle */}
              <button
                className={[
                  'absolute top-10 left-1/2 -translate-x-1/2',
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  'bg-background border border-border text-foreground',
                  'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                  canRemove
                    ? 'cursor-pointer hover:bg-destructive hover:text-destructive-foreground hover:border-destructive'
                    : 'cursor-not-allowed opacity-30',
                ].join(' ')}
                onClick={e => {
                  e.stopPropagation()
                  if (canRemove) onRemoveStop(stop.id)
                }}
                tabIndex={-1}
                aria-label="remove stop"
              >
                <X size={8} strokeWidth={2.5} />
              </button>

              {/* The draggable handle */}
              <button
                data-stop-handle
                className={[
                  'cvd-color w-4 h-6 rounded-sm border-2 cursor-grab active:cursor-grabbing',
                  'transition-all duration-100 touch-none',
                  isSelected
                    ? 'border-foreground scale-110 shadow-md'
                    : 'border-foreground/50 hover:border-foreground hover:scale-105',
                ].join(' ')}
                style={{ backgroundColor: stop.hex }}
                onPointerDown={e => handlePointerDown(e, stop)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={e => {
                  e.stopPropagation()
                  if (!didDragRef.current) onSelectStop(stop.id)
                }}
                aria-label={`color stop at ${stop.position}%`}
              />

              {/* Position label — shows on selected */}
              {isSelected && (
                <span className="absolute top-7 left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground whitespace-nowrap pointer-events-none">
                  {stop.position}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
