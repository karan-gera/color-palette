import { describe, expect, it } from 'vitest'
import { HELP_CONTENT } from '@/components/helpContentIndex'
import { searchHelp, type HelpSearchEntry } from '@/helpers/helpSearch'

const entries: HelpSearchEntry[] = [
  { id: 'contrast', title: 'contrast checker', section: 'accessibility', summary: 'check wcag text contrast', keywords: ['hard to read'], shortcuts: ['k'] },
  { id: 'share', title: 'share via url', section: 'copy & share', summary: 'copy a link to the palette', keywords: ['send'], shortcuts: ['c'] },
  { id: 'save-open', title: 'save & open', section: 'storage', summary: 'recover palettes stored in this browser', keywords: ['lost', 'find'], shortcuts: ['o', 's'] },
]

describe('searchHelp', () => {
  it('returns a small default set for an empty query', () => {
    expect(searchHelp(entries, '')).toEqual(entries)
  })

  it('finds titles, body summaries, synonyms, and shortcuts', () => {
    expect(searchHelp(entries, 'contrast')[0].id).toBe('contrast')
    expect(searchHelp(entries, 'wcag')[0].id).toBe('contrast')
    expect(searchHelp(entries, 'lost')[0].id).toBe('save-open')
    expect(searchHelp(entries, 'k')[0].id).toBe('contrast')
  })

  it('tolerates short typos within a token', () => {
    expect(searchHelp(entries, 'cntrast')[0].id).toBe('contrast')
    expect(searchHelp(entries, 'contrsat')[0].id).toBe('contrast')
  })

  it('does not match scattered letters across unrelated prose', () => {
    expect(searchHelp(entries, 'contrast').map((entry) => entry.id)).toEqual(['contrast'])
  })

  it('requires every query term to match the same entry', () => {
    expect(searchHelp(entries, 'copy link').map((entry) => entry.id)).toEqual(['share'])
  })

  it('ignores conversational filler words in multi-word queries', () => {
    expect(searchHelp(HELP_CONTENT, 'how do i export to clip studio paint')[0]?.id).toBe('export')
    expect(searchHelp(HELP_CONTENT, 'where are my palettes stored')[0]?.id).toBe('save-open')
  })

  it('matches punctuation and compact spellings consistently', () => {
    expect(searchHelp(HELP_CONTENT, 'paint.net')[0]?.id).toBe('export')
    expect(searchHelp(HELP_CONTENT, 'paintnet')[0]?.id).toBe('export')
    expect(searchHelp(HELP_CONTENT, 'clipstudio')[0]?.id).toBe('export')
  })

  it.each([
    ['make my first palette', 'getting-started'],
    ['freeze color', 'palette'],
    ['cmd z', 'undo-redo'],
    ['colors that go together', 'relationships'],
    ['earth tones', 'presets'],
    ['lost palette', 'save-open'],
    ['organize palettes into folders', 'collections'],
    ['filter saved palettes by label', 'tags'],
    ['move palettes to another computer', 'backup'],
    ['copy css vars', 'copy-formats'],
    ['send palette link to teammate', 'share'],
    ['clip studio paint', 'export'],
    ['csp', 'export'],
    ['photoshp swatches', 'export'],
    ['change exact oklch value', 'edit-mode'],
    ['gradient wallpaper', 'gradient'],
    ['see colors in a ui mockup', 'preview'],
    ['colors from photo', 'extract'],
    ['pick pixel from screen', 'color-picker'],
    ['what color is this', 'color-naming'],
    ['make this color lighter', 'variations'],
    ['why do these colors clash', 'harmony'],
    ['turn off animation', 'reduced-motion'],
    ['red green color blind', 'color-blindness'],
    ['text is hard to read', 'contrast'],
    ['switch to dark mode', 'theme'],
    ['keyboard cheat sheet', 'keyboard'],
  ])('routes the intent %s to %s', (query, expectedId) => {
    expect(searchHelp(HELP_CONTENT, query)[0]?.id).toBe(expectedId)
  })

  it.each([
    ['make a color palette', 'getting-started'],
    ['color combinations', 'relationships'],
    ['palette folders', 'collections'],
    ['save my colors', 'save-open'],
    ['backup palettes', 'backup'],
    ['share link', 'share'],
    ['copy colors to clipboard', 'copy-formats'],
    ['export colors', 'export'],
    ['save as png', 'export'],
  ])('covers broader natural-language intent %s → %s', (query, expectedId) => {
    expect(searchHelp(HELP_CONTENT, query)[0]?.id).toBe(expectedId)
  })

  it.each([
    ['how do i save a palette', 'save-open'],
    ['how do i organize saved palettes', 'collections'],
    ['how do i share a palette', 'share'],
  ])('keeps adjacent intents distinct for %s', (query, expectedId) => {
    expect(searchHelp(HELP_CONTENT, query)[0]?.id).toBe(expectedId)
  })
})
