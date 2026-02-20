import { describe, it } from 'vitest'

// Session Palette History — planned feature (see TODO.md)
// A useSessionHistory hook that captures palette snapshots during a session.
// Session-only (no localStorage persistence). Activate when implemented.

describe('useSessionHistory (future)', () => {
  it.todo('initial state: returns an empty snapshots array')
  it.todo('push: captures a new palette state as a snapshot')
  it.todo('push: deduplicates consecutive identical states (same hex array does not create a duplicate entry)')
  it.todo('push: different palette always creates a new entry even if visually similar')
  it.todo('push: caps history at 50 entries — 51st push evicts the oldest snapshot')
  it.todo('push: order is preserved (most recent last)')
  it.todo('restore: calling restore with a snapshot index invokes the callback with correct palette')
  it.todo('restore: restoring pushes to the main undo stack (non-destructive)')
  it.todo('session-only: hook state does not write to localStorage')
  it.todo('session-only: re-mounting the component initializes to an empty history')
  it.todo('currentIndex: points to the active entry when palette matches a snapshot')
  it.todo('currentIndex: is null when current palette does not match any snapshot')
})
