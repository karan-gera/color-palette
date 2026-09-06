import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GradientExportDialog from '@/components/GradientExportDialog'
import type { LinearGradientConfig } from '@/helpers/gradientGenerator'

const config: LinearGradientConfig = {
  type: 'linear',
  angle: 90,
  stops: [
    { id: 'start', position: 0, hex: '#000000', source: { type: 'custom' } },
    { id: 'end', position: 100, hex: '#ffffff', source: { type: 'custom' } },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GradientExportDialog keyboard navigation', () => {
  it('moves focus with ArrowDown and exports the focused Tailwind format with Enter', async () => {
    const onCopied = vi.fn()
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)

    render(
      <GradientExportDialog
        config={config}
        aspectRatio={16 / 9}
        onCancel={vi.fn()}
        onCopied={onCopied}
      />,
    )

    const cssButton = screen.getByRole('button', { name: /CSS.*copy/i })
    const tailwindButton = screen.getByRole('button', { name: /Tailwind.*copy/i })
    await waitFor(() => expect(cssButton).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    expect(tailwindButton).toHaveFocus()

    await user.keyboard('{Enter}')

    await waitFor(() => expect(onCopied).toHaveBeenCalledWith('copied tailwind gradient'))
    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0][0]).toContain('bg-gradient-to-r')
  })
})
