import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import NotificationToast from '@/components/NotificationToast'

describe('NotificationToast', () => {
  it('keeps the live region mounted while its message changes', () => {
    const { rerender } = render(<NotificationToast message={null} />)
    const liveRegion = screen.getByRole('status')

    expect(liveRegion).toBeEmptyDOMElement()

    rerender(<NotificationToast message="link copied to clipboard" />)

    expect(screen.getByRole('status')).toBe(liveRegion)
    expect(liveRegion).toHaveTextContent('link copied to clipboard')
  })

  it('hides the visual toast from assistive technology', () => {
    const { container } = render(<NotificationToast message="copied #123456" />)

    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('copied #123456')
    expect(screen.getAllByText('copied #123456')).toHaveLength(2)
  })
})
