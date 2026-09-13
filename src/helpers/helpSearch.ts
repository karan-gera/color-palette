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
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const QUERY_FILLER_WORDS = new Set([
  'a', 'an', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'into', 'is',
  'me', 'my', 'of', 'please', 'the', 'these', 'this', 'to', 'use', 'what', 'where',
  'why', 'with',
])

function fuzzyTokenMatch(candidate: string, query: string) {
  const maxDistance = query.length >= 8 ? 2 : query.length >= 4 ? 1 : 0
  if (maxDistance === 0 || Math.abs(candidate.length - query.length) > maxDistance) return false

  const distances = Array.from({ length: candidate.length + 1 }, (_, index) =>
    Array.from({ length: query.length + 1 }, (__, queryIndex) => index || queryIndex)
  )

  for (let index = 1; index <= candidate.length; index += 1) {
    for (let queryIndex = 1; queryIndex <= query.length; queryIndex += 1) {
      const substitutionCost = candidate[index - 1] === query[queryIndex - 1] ? 0 : 1
      distances[index][queryIndex] = Math.min(
        distances[index - 1][queryIndex] + 1,
        distances[index][queryIndex - 1] + 1,
        distances[index - 1][queryIndex - 1] + substitutionCost
      )
      if (
        index > 1 && queryIndex > 1
        && candidate[index - 1] === query[queryIndex - 2]
        && candidate[index - 2] === query[queryIndex - 1]
      ) {
        distances[index][queryIndex] = Math.min(
          distances[index][queryIndex],
          distances[index - 2][queryIndex - 2] + 1
        )
      }
    }
  }

  return distances[candidate.length][query.length] <= maxDistance
}

function scoreField(value: string, query: string, weight: number) {
  const normalized = normalize(value)
  if (normalized === query || normalized.replaceAll(' ', '') === query.replaceAll(' ', '')) return weight * 8
  if (normalized.startsWith(query)) return weight * 5
  if (normalized.includes(query)) return weight * 3

  const tokens = normalized.split(' ')
  if (tokens.some((token) => fuzzyTokenMatch(token, query))) return weight
  return 0
}

function scoreValues(values: string[], query: string, weight: number) {
  return Math.max(0, ...values.map((value) => scoreField(value, query, weight)))
}

export function searchHelp(entries: HelpSearchEntry[], rawQuery: string) {
  const normalizedQuery = normalize(rawQuery)
  const allQueryTerms = normalizedQuery.split(' ').filter(Boolean)
  if (allQueryTerms.length === 0) return entries.slice(0, 6)
  const meaningfulTerms = allQueryTerms.filter((term) => !QUERY_FILLER_WORDS.has(term))
  const queryTerms = meaningfulTerms.length > 0 ? meaningfulTerms : allQueryTerms

  return entries
    .map((entry) => {
      const fields = [
        { values: [entry.title], weight: 8 },
        { values: [entry.section], weight: 3 },
        { values: [entry.summary], weight: 4 },
        { values: entry.keywords ?? [], weight: 5 },
        { values: entry.shortcuts ?? [], weight: 6 },
      ]
      const termScores = queryTerms.map((term) =>
        Math.max(...fields.map(({ values, weight }) => scoreValues(values, term, weight)))
      )
      const phraseScore = Math.max(
        ...fields.map(({ values, weight }) => scoreValues(values, normalizedQuery, weight))
      )
      return {
        entry,
        score: phraseScore + termScores.reduce((total, score) => total + score, 0),
        matches: termScores.every(Boolean),
      }
    })
    .filter(({ matches }) => matches)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(({ entry }) => entry)
}
