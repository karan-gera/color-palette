import { useState, useCallback, useEffect, useRef } from 'react'
import {
  initStopsFromPalette,
  type GradientStop,
} from '@/helpers/gradientGenerator'

const MIN_STOPS = 2
const COLLISION_GUARD = 2 // minimum % distance between stops
const DEFAULT_ANGLE = 90
const STORAGE_KEY = 'color-palette:gradient'
const SAVE_DEBOUNCE_MS = 800

type ColorSource =
  | { type: 'palette'; colorId: string; hex: string }
  | { type: 'custom'; hex: string }

export type UseGradientStopsReturn = {
  stops: GradientStop[]
  angle: number
  addStop: (position: number, source: ColorSource) => void
  removeStop: (id: string) => void
  moveStop: (id: string, newPosition: number) => void
  setStopColor: (id: string, source: ColorSource) => void
  setAngle: (degrees: number) => void
  syncPaletteColors: (palette: Array<{ id: string; hex: string }>) => void
  resetToPalette: (colors: string[], colorIds: string[]) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isTooClose(
  position: number,
  stops: GradientStop[],
  excludeId?: string,
): boolean {
  return stops.some(
    s => s.id !== excludeId && Math.abs(s.position - position) < COLLISION_GUARD,
  )
}

function sourceToStop(
  source: ColorSource,
): Pick<GradientStop, 'hex' | 'source'> {
  if (source.type === 'palette') {
    return {
      hex: source.hex,
      source: { type: 'palette', colorId: source.colorId },
    }
  }
  return {
    hex: source.hex,
    source: { type: 'custom' },
  }
}

type PersistedGradient = {
  stops: GradientStop[]
  angle: number
}

function loadPersisted(): PersistedGradient | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedGradient
    if (!Array.isArray(parsed.stops) || parsed.stops.length < MIN_STOPS) return null
    if (typeof parsed.angle !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function useGradientStops(
  initialColors: string[] = [],
  initialColorIds: string[] = [],
): UseGradientStopsReturn {
  const persisted = useRef(loadPersisted()).current

  const [stops, setStops] = useState<GradientStop[]>(() =>
    persisted?.stops ?? initStopsFromPalette(initialColors, initialColorIds),
  )
  const [angle, setAngleState] = useState<number>(
    () => persisted?.angle ?? DEFAULT_ANGLE,
  )

  // Keep a ref with the latest values so beforeunload can flush synchronously
  const latestRef = useRef({ stops, angle })
  useEffect(() => {
    latestRef.current = { stops, angle }
  }, [stops, angle])

  // Debounced save to localStorage whenever stops or angle change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ stops, angle }))
      } catch {}
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [stops, angle])

  // Flush latest values synchronously on page unload so a refresh mid-debounce
  // doesn't revert to the previously-saved state
  useEffect(() => {
    function saveNow() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(latestRef.current))
      } catch {}
    }
    window.addEventListener('beforeunload', saveNow)
    return () => window.removeEventListener('beforeunload', saveNow)
  }, [])

  const addStop = useCallback((position: number, source: ColorSource) => {
    const clamped = clamp(Math.round(position), 0, 100)
    setStops(prev => {
      if (isTooClose(clamped, prev)) return prev
      const newStop: GradientStop = {
        id: crypto.randomUUID(),
        position: clamped,
        ...sourceToStop(source),
      }
      return [...prev, newStop]
    })
  }, [])

  const removeStop = useCallback((id: string) => {
    setStops(prev => {
      if (prev.length <= MIN_STOPS) return prev
      return prev.filter(s => s.id !== id)
    })
  }, [])

  const moveStop = useCallback((id: string, newPosition: number) => {
    const clamped = clamp(Math.round(newPosition), 0, 100)
    setStops(prev => {
      if (isTooClose(clamped, prev, id)) return prev
      return prev.map(s => (s.id === id ? { ...s, position: clamped } : s))
    })
  }, [])

  const setStopColor = useCallback((id: string, source: ColorSource) => {
    setStops(prev =>
      prev.map(s => (s.id === id ? { ...s, ...sourceToStop(source) } : s)),
    )
  }, [])

  const setAngle = useCallback((degrees: number) => {
    setAngleState(clamp(Math.round(degrees), 0, 360))
  }, [])

  // Called when the palette rerolls — updates hex on palette-linked stops
  const syncPaletteColors = useCallback(
    (palette: Array<{ id: string; hex: string }>) => {
      const lookup = new Map(palette.map(p => [p.id, p.hex]))
      setStops(prev =>
        prev.map(s => {
          if (s.source.type !== 'palette') return s
          const newHex = lookup.get(s.source.colorId)
          if (!newHex || newHex === s.hex) return s
          return { ...s, hex: newHex }
        }),
      )
    },
    [],
  )

  // Completely re-seeds stops from the current palette
  const resetToPalette = useCallback((colors: string[], colorIds: string[]) => {
    setStops(initStopsFromPalette(colors, colorIds))
  }, [])

  return {
    stops,
    angle,
    addStop,
    removeStop,
    moveStop,
    setStopColor,
    setAngle,
    syncPaletteColors,
    resetToPalette,
  }
}
