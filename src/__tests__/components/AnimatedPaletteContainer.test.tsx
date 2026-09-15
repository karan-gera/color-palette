import { act, render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import AnimatedPaletteContainer from '@/components/AnimatedPaletteContainer'

const noop = vi.fn()

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterAll(() => vi.unstubAllGlobals())

function palette(colors: string[], colorIds: string[], navigationEpoch: number) {
  return (
    <AnimatedPaletteContainer
      colors={colors}
      colorIds={colorIds}
      navigationEpoch={navigationEpoch}
      lockedStates={colors.map(() => false)}
      editIndex={null}
      onEditStart={noop}
      onEditSave={noop}
      onEditCancel={noop}
      onReroll={noop}
      onDelete={noop}
      onToggleLock={noop}
      onViewVariations={noop}
      onAdd={noop}
      swapMode={false}
      swapSelection={null}
      onSwapClick={noop}
    />
  )
}

describe('AnimatedPaletteContainer history isolation', () => {
  it('preserves item nodes for direct changes but clears interrupted exits on navigation', () => {
    const ids = ['one', 'two', 'three', 'four']
    const { rerender } = render(palette(['#111111', '#222222', '#333333'], ids.slice(0, 3), 0))
    const firstCircle = screen.getByRole('button', { name: 'lock color #111111' })

    rerender(palette(['#aaaaaa', '#222222', '#333333'], ids.slice(0, 3), 0))
    expect(screen.getByRole('button', { name: 'lock color #aaaaaa' })).toBe(firstCircle)

    rerender(palette(['#aaaaaa', '#222222', '#333333', '#444444'], ids, 0))
    expect(screen.getByRole('button', { name: 'lock color #aaaaaa' })).toBe(firstCircle)

    rerender(palette(['#aaaaaa', '#333333', '#444444'], ['one', 'three', 'four'], 0))
    expect(screen.getByRole('button', { name: 'lock color #aaaaaa' })).toBe(firstCircle)
    expect(screen.getByRole('button', { name: 'lock color #222222' })).toBeInTheDocument()

    rerender(palette([], [], 1))
    expect(screen.queryAllByRole('button', { name: /^(?:un)?lock color/i })).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'add color' })).toBeInTheDocument()
  })

  it('restores focus to the equivalent or nearest control after navigation remounts', () => {
    const { rerender } = render(palette(
      ['#111111', '#222222', '#333333'],
      ['one', 'two', 'three'],
      0,
    ))
    act(() => screen.getByRole('button', { name: 'edit color #222222' }).focus())

    rerender(palette(
      ['#aaaaaa', '#bbbbbb', '#cccccc'],
      ['one', 'two', 'three'],
      1,
    ))
    expect(screen.getByRole('button', { name: 'edit color #bbbbbb' })).toHaveFocus()

    act(() => screen.getByRole('button', { name: 'lock color #cccccc' }).focus())
    rerender(palette(['#dddddd'], ['one'], 2))
    expect(screen.getByRole('button', { name: 'lock color #dddddd' })).toHaveFocus()

    rerender(palette([], [], 3))
    expect(screen.getByRole('button', { name: 'add color' })).toHaveFocus()
  })
})
