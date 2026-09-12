import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FIRST_VISIT_WELCOME_KEY, useFirstVisitWelcome } from '@/hooks/useFirstVisitWelcome'

describe('useFirstVisitWelcome', () => {
  it('opens the welcome dialog on a first visit', () => {
    const { result } = renderHook(() => useFirstVisitWelcome())

    expect(result.current.isWelcomeOpen).toBe(true)
  })

  it('stays closed after the welcome has been dismissed', () => {
    localStorage.setItem(FIRST_VISIT_WELCOME_KEY, '1')

    const { result } = renderHook(() => useFirstVisitWelcome())

    expect(result.current.isWelcomeOpen).toBe(false)
  })

  it('persists dismissal and closes the dialog', () => {
    const { result } = renderHook(() => useFirstVisitWelcome())

    act(() => result.current.dismissWelcome())

    expect(result.current.isWelcomeOpen).toBe(false)
    expect(localStorage.getItem(FIRST_VISIT_WELCOME_KEY)).toBe('1')
  })
})
