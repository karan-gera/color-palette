import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { searchHelp } from '@/helpers/helpSearch'
import { HELP_CONTENT } from './helpContentIndex'

type HelpSearchProps = {
  inputRef: React.RefObject<HTMLInputElement | null>
  isOpen: boolean
  query: string
  onQueryChange: (query: string) => void
  onOpen: () => void
  onClose: () => void
  onSelectPage: (pageId: string) => void
}

export default function HelpSearch({ inputRef, isOpen, query, onQueryChange, onOpen, onClose, onSelectPage }: HelpSearchProps) {
  const results = useMemo(() => searchHelp(HELP_CONTENT, query), [query])
  const [activeIndex, setActiveIndex] = useState(0)

  const selectResult = (pageId: string) => {
    onSelectPage(pageId)
    onClose()
  }

  return (
    <div className="relative flex min-h-14 w-full shrink-0 items-center gap-2 bg-[#f5dce9] px-3 py-2 text-[#351126]">
      <Search className="size-4 shrink-0 text-[#a52460]" aria-hidden="true" />
      <label htmlFor="help-search" className="shrink-0 text-xs text-[#842050]">search help</label>
      <input
        ref={inputRef}
        id="help-search"
        role="combobox"
        aria-controls="help-search-results"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        value={query}
        onFocus={onOpen}
        onChange={(event) => { onQueryChange(event.target.value); setActiveIndex(0) }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, results.length - 1)) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
          if (event.key === 'Enter' && results[activeIndex]) { event.preventDefault(); selectResult(results[activeIndex].id) }
        }}
        placeholder="articles, features, shortcuts…"
        className="h-9 min-w-0 flex-1 rounded-md border border-[#dfa5c1] bg-[#fffafd] px-3 text-xs text-[#21141a] outline-none placeholder:text-[#846574] focus-visible:ring-2 focus-visible:ring-[#c9367b]"
      />
      <kbd className="hidden rounded border border-[#dfa5c1] bg-[#fffafd] px-1.5 py-0.5 text-[11px] sm:inline">/</kbd>
      {isOpen && (
        <div id="help-search-results" role="listbox" className="absolute left-3 right-3 top-[calc(100%+0.5rem)] z-20 max-h-[min(32rem,calc(100vh-6rem))] overflow-y-auto rounded-lg border bg-popover p-2 text-popover-foreground shadow-2xl">
          <p className="px-3 py-2 text-[11px] text-muted-foreground" aria-live="polite">
            {query ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'suggested pages'}
          </p>
          {results.map((entry, index) => (
            <button key={entry.id} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectResult(entry.id)} className="grid w-full grid-cols-[7rem_minmax(0,1fr)] gap-4 rounded-md px-3 py-3 text-left text-[#351126] hover:bg-[#f5dce9]/50 aria-selected:bg-[#f5dce9]">
              <span className="text-[11px] text-[#a52460]">{entry.section}</span>
              <span><strong className="block text-sm font-medium">{entry.title}</strong><span className="mt-1 block text-xs leading-5 text-[#725767]">{entry.summary}</span></span>
            </button>
          ))}
          {results.length === 0 && <p className="px-3 py-6 text-sm text-muted-foreground">no matching help pages. try a feature name, action, or shortcut.</p>}
        </div>
      )}
    </div>
  )
}
