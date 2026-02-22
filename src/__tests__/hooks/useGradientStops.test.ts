import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGradientStops } from '@/hooks/useGradientStops'

const COLORS  = ['#ff0000', '#00ff00', '#0000ff']
const IDS     = ['id-a', 'id-b', 'id-c']
const TWO_COLORS = ['#ff0000', '#0000ff']
const TWO_IDS    = ['id-a', 'id-b']

function setup(colors = COLORS, ids = IDS) {
  return renderHook(() => useGradientStops(colors, ids))
}

// ─── initialization ───────────────────────────────────────────────────────────

describe('useGradientStops — initialization', () => {
  it('initializes with evenly distributed stops from palette', () => {
    const { result } = setup()
    expect(result.current.stops).toHaveLength(3)
    expect(result.current.stops[0].position).toBe(0)
    expect(result.current.stops[1].position).toBe(50)
    expect(result.current.stops[2].position).toBe(100)
  })

  it('default angle is 90', () => {
    const { result } = setup()
    expect(result.current.angle).toBe(90)
  })
})

// ─── addStop ─────────────────────────────────────────────────────────────────

describe('addStop', () => {
  it('adds a stop at the given position', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    act(() => {
      result.current.addStop(50, { type: 'custom', hex: '#ffffff' })
    })
    expect(result.current.stops).toHaveLength(3)
    expect(result.current.stops.some(s => s.position === 50)).toBe(true)
  })

  it('respects collision guard — ignores stop within 2% of existing', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    act(() => {
      result.current.addStop(1, { type: 'custom', hex: '#ffffff' }) // within 2% of position 0
    })
    expect(result.current.stops).toHaveLength(2) // unchanged
  })

  it('allows stop just outside the collision guard', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    act(() => {
      result.current.addStop(50, { type: 'custom', hex: '#ffffff' })
    })
    expect(result.current.stops).toHaveLength(3)
  })

  it('palette-linked stop stores colorId', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    act(() => {
      result.current.addStop(50, { type: 'palette', colorId: 'id-a', hex: '#ff0000' })
    })
    const added = result.current.stops.find(s => s.position === 50)
    expect(added?.source).toEqual({ type: 'palette', colorId: 'id-a' })
    expect(added?.hex).toBe('#ff0000')
  })

  it('custom stop has no colorId', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    act(() => {
      result.current.addStop(50, { type: 'custom', hex: '#aabbcc' })
    })
    const added = result.current.stops.find(s => s.position === 50)
    expect(added?.source.type).toBe('custom')
    expect(added?.hex).toBe('#aabbcc')
  })
})

// ─── removeStop ──────────────────────────────────────────────────────────────

describe('removeStop', () => {
  it('removes a stop by id', () => {
    const { result } = setup()
    const idToRemove = result.current.stops[1].id
    act(() => {
      result.current.removeStop(idToRemove)
    })
    expect(result.current.stops).toHaveLength(2)
    expect(result.current.stops.find(s => s.id === idToRemove)).toBeUndefined()
  })

  it('does not remove below 2 stops', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    const id = result.current.stops[0].id
    act(() => {
      result.current.removeStop(id)
    })
    expect(result.current.stops).toHaveLength(2) // unchanged
  })
})

// ─── moveStop ────────────────────────────────────────────────────────────────

describe('moveStop', () => {
  it('moves a stop to a new position', () => {
    const { result } = setup()
    const id = result.current.stops[1].id // starts at 50
    act(() => {
      result.current.moveStop(id, 70)
    })
    expect(result.current.stops.find(s => s.id === id)?.position).toBe(70)
  })

  it('clamps position to 0–100', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    const id = result.current.stops[0].id
    act(() => {
      result.current.moveStop(id, -50)
    })
    expect(result.current.stops.find(s => s.id === id)?.position).toBe(0)
  })

  it('clamps upper bound to 100', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    const id = result.current.stops[1].id
    act(() => {
      result.current.moveStop(id, 150)
    })
    expect(result.current.stops.find(s => s.id === id)?.position).toBe(100)
  })

  it('ignores move that would collide with another stop', () => {
    const { result } = setup()
    const id = result.current.stops[1].id // at 50
    act(() => {
      result.current.moveStop(id, 1) // within 2% of stop at 0
    })
    expect(result.current.stops.find(s => s.id === id)?.position).toBe(50) // unchanged
  })
})

// ─── setStopColor ─────────────────────────────────────────────────────────────

describe('setStopColor', () => {
  it('updates hex and source for a stop', () => {
    const { result } = setup()
    const id = result.current.stops[0].id
    act(() => {
      result.current.setStopColor(id, { type: 'custom', hex: '#123456' })
    })
    const stop = result.current.stops.find(s => s.id === id)
    expect(stop?.hex).toBe('#123456')
    expect(stop?.source.type).toBe('custom')
  })

  it('can switch a stop from custom to palette-linked', () => {
    const { result } = setup()
    const id = result.current.stops[0].id
    act(() => {
      result.current.setStopColor(id, { type: 'palette', colorId: 'id-b', hex: '#00ff00' })
    })
    const stop = result.current.stops.find(s => s.id === id)
    expect(stop?.source).toEqual({ type: 'palette', colorId: 'id-b' })
  })
})

// ─── setAngle ────────────────────────────────────────────────────────────────

describe('setAngle', () => {
  it('sets the angle', () => {
    const { result } = setup()
    act(() => { result.current.setAngle(45) })
    expect(result.current.angle).toBe(45)
  })

  it('clamps angle to 0–360', () => {
    const { result } = setup()
    act(() => { result.current.setAngle(-10) })
    expect(result.current.angle).toBe(0)
    act(() => { result.current.setAngle(400) })
    expect(result.current.angle).toBe(360)
  })

  it('rounds to nearest integer', () => {
    const { result } = setup()
    act(() => { result.current.setAngle(45.7) })
    expect(result.current.angle).toBe(46)
  })
})

// ─── syncPaletteColors ────────────────────────────────────────────────────────

describe('syncPaletteColors', () => {
  it('updates hex on palette-linked stops when palette changes', () => {
    const { result } = setup()
    const id0 = result.current.stops[0].id
    act(() => {
      result.current.syncPaletteColors([
        { id: 'id-a', hex: '#aaaaaa' },
        { id: 'id-b', hex: '#bbbbbb' },
        { id: 'id-c', hex: '#cccccc' },
      ])
    })
    expect(result.current.stops.find(s => s.id === id0)?.hex).toBe('#aaaaaa')
  })

  it('does not update custom stops', () => {
    const { result } = setup(TWO_COLORS, TWO_IDS)
    // Add a custom stop
    act(() => {
      result.current.addStop(50, { type: 'custom', hex: '#ffffff' })
    })
    const customStop = result.current.stops.find(s => s.position === 50)!
    act(() => {
      result.current.syncPaletteColors([
        { id: 'id-a', hex: '#aaaaaa' },
        { id: 'id-b', hex: '#bbbbbb' },
      ])
    })
    // Custom stop hex unchanged
    expect(result.current.stops.find(s => s.id === customStop.id)?.hex).toBe('#ffffff')
  })

  it('ignores palette entries that do not match any stop colorId', () => {
    const { result } = setup()
    const before = result.current.stops.map(s => s.hex)
    act(() => {
      result.current.syncPaletteColors([{ id: 'unknown-id', hex: '#ffffff' }])
    })
    expect(result.current.stops.map(s => s.hex)).toEqual(before)
  })
})

// ─── resetToPalette ──────────────────────────────────────────────────────────

describe('resetToPalette', () => {
  it('replaces all stops with new palette colors', () => {
    const { result } = setup()
    act(() => {
      // Add an extra custom stop
      result.current.addStop(25, { type: 'custom', hex: '#ffffff' })
    })
    expect(result.current.stops).toHaveLength(4)
    act(() => {
      result.current.resetToPalette(TWO_COLORS, TWO_IDS)
    })
    expect(result.current.stops).toHaveLength(2)
    expect(result.current.stops[0].hex).toBe('#ff0000')
    expect(result.current.stops[1].hex).toBe('#0000ff')
  })

  it('new stops are palette-linked after reset', () => {
    const { result } = setup()
    act(() => {
      result.current.resetToPalette(TWO_COLORS, TWO_IDS)
    })
    expect(result.current.stops.every(s => s.source.type === 'palette')).toBe(true)
  })
})
