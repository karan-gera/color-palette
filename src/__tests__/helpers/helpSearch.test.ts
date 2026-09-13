import { describe, expect, it } from 'vitest'
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
  })

  it('does not match scattered letters across unrelated prose', () => {
    expect(searchHelp(entries, 'contrast').map((entry) => entry.id)).toEqual(['contrast'])
  })

  it('requires every query term to match the same entry', () => {
    expect(searchHelp(entries, 'copy link').map((entry) => entry.id)).toEqual(['share'])
  })
})
