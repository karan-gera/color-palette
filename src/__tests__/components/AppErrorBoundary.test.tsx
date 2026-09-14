import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import AppErrorBoundary from '@/components/AppErrorBoundary'

function CrashingChild(): ReactNode {
  throw new Error('simulated render failure')
}

function RecoverableHarness() {
  const [shouldCrash, setShouldCrash] = useState(true)

  return (
    <AppErrorBoundary onReset={() => setShouldCrash(false)}>
      {shouldCrash ? <CrashingChild /> : <p>workspace recovered</p>}
    </AppErrorBoundary>
  )
}

describe('AppErrorBoundary', () => {
  it('shows a readable recovery screen when a child throws', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <CrashingChild />
      </AppErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveFocus()
    expect(screen.getByRole('heading', { name: 'something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'try again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'reload app' })).toBeInTheDocument()

    errorSpy.mockRestore()
  })

  it('can retry without clearing local data', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem('color-palette:saved', JSON.stringify([{ id: 'kept' }]))

    render(<RecoverableHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'try again' }))

    expect(screen.getByText('workspace recovered')).toBeInTheDocument()
    expect(localStorage.getItem('color-palette:saved')).toContain('kept')

    errorSpy.mockRestore()
  })

  it('delegates reload to the provided handler', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onReload = vi.fn()

    render(
      <AppErrorBoundary onReload={onReload}>
        <CrashingChild />
      </AppErrorBoundary>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'reload app' }))

    expect(onReload).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })
})
