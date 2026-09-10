import { describe, it } from 'vitest'

// Palette Collections and Tags — shipped test debt (see TESTING.md)
// Tags and collections now exist, but these old assumptions have not all been
// reconciled with the current storage and UI contracts.

describe('paletteCollections (test debt)', () => {
  it.todo('SavedPalette with tags field: loads correctly from storage')
  it.todo('SavedPalette without tags field: backward-compatible load returns tags=[]')
  it.todo('savePalette with tags: tags are persisted correctly')
  it.todo('filter by tag: returns only palettes containing that tag')
  it.todo('filter by tag: empty tag filter returns all palettes')
  it.todo('filter by nonexistent tag: returns empty array')
  it.todo('filter is case-insensitive (tag "UI" matches "ui" and "Ui")')
  it.todo('add tag to palette: tag appears in result and is persisted')
  it.todo('add duplicate tag to palette: is a no-op (no duplicate tags in array)')
  it.todo('remove tag from palette: tag no longer appears in result')
  it.todo('search by name: case-insensitive substring match')
  it.todo('search by tag: returns palettes with matching tag')
  it.todo('search combined (name AND tag): returns only palettes matching both')
  it.todo('tags persist through export/import JSON round-trip')
  it.todo('mergePalettes: tags field is preserved on imported palettes')
})
