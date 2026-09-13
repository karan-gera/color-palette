import type { ReactNode } from 'react'

export default function DevErrorBoundaryTrigger({ children }: { children: ReactNode }) {
  const crashTestRequested = import.meta.env.DEV && new URLSearchParams(window.location.search).get('test-error-boundary') === '1'
  if (crashTestRequested) {
    throw new Error('development error-boundary test')
  }

  return children
}
