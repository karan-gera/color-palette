export type HelpSearchEntry = {
  id: string
  title: string
  section: string
  summary: string
  keywords?: string[]
  shortcuts?: string[]
  related?: string[]
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function isSubsequence(candidate: string, query: string) {
  if (candidate.length > query.length + 3) return false
  let queryIndex = 0
  for (const character of candidate) {
    if (character === query[queryIndex]) queryIndex += 1
  }
  return queryIndex === query.length
}

function scoreField(value: string, query: string, weight: number) {
  const normalized = normalize(value)
  if (normalized === query) return weight * 8
  if (normalized.startsWith(query)) return weight * 5
  if (normalized.includes(query)) return weight * 3

  const tokens = normalized.split(' ')
  if (tokens.some((token) => isSubsequence(token, query))) return weight
  return 0
}

export function searchHelp(entries: HelpSearchEntry[], rawQuery: string) {
  const queryTerms = normalize(rawQuery).split(' ').filter(Boolean)
  if (queryTerms.length === 0) return entries.slice(0, 6)

  return entries
    .map((entry) => {
      const fields = [
        { value: entry.title, weight: 8 },
        { value: entry.section, weight: 3 },
        { value: entry.summary, weight: 4 },
        { value: entry.keywords?.join(' ') ?? '', weight: 5 },
        { value: entry.shortcuts?.join(' ') ?? '', weight: 6 },
      ]
      const termScores = queryTerms.map((term) =>
        Math.max(...fields.map(({ value, weight }) => scoreField(value, term, weight)))
      )
      return { entry, score: termScores.reduce((total, score) => total + score, 0), matches: termScores.every(Boolean) }
    })
    .filter(({ matches }) => matches)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => entry)
}
