import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import HelpReferenceRail from './HelpReferenceRail'
import HelpSearch from './HelpSearch'
import HelpSidebar from './HelpSidebar'
import { HELP_CONTENT } from './helpContentIndex'

type HelpBrowserProps = {
  activePage: string
  children: React.ReactNode
  onActivePageChange: (pageId: string) => void
  navScrollTop: number
  contentScrollTop: number
  onNavScroll: (scrollTop: number) => void
  onContentScroll: (scrollTop: number) => void
}

function headingId(text: string, index: number) {
  return `help-heading-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${index}`
}

export default function HelpBrowser({ activePage, children, onActivePageChange, navScrollTop, contentScrollTop, onNavScroll, onContentScroll }: HelpBrowserProps) {
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [headings, setHeadings] = useState<{ id: string; label: string }[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const headingElements = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('article h3') ?? [])
    setHeadings(headingElements.map((heading, index) => {
      const id = headingId(heading.textContent ?? 'section', index)
      heading.id = id
      return { id, label: heading.textContent ?? 'section' }
    }))
  }, [activePage, children])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== searchInputRef.current) {
        event.preventDefault()
        event.stopImmediatePropagation()
        searchInputRef.current?.focus()
      } else if (event.key === 'Escape' && isSearchOpen) {
        event.preventDefault()
        event.stopImmediatePropagation()
        setIsSearchOpen(false)
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isSearchOpen])

  const selectPage = useCallback((pageId: string) => {
    onActivePageChange(pageId)
    setQuery('')
  }, [onActivePageChange])

  const restoreNavScroll = useCallback((element: HTMLElement | null) => {
    if (element) element.scrollTop = navScrollTop
  }, [navScrollTop])
  const restoreContentScroll = useCallback((element: HTMLDivElement | null) => {
    contentRef.current = element
    if (element) element.scrollTop = contentScrollTop
  }, [contentScrollTop])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <HelpSearch inputRef={searchInputRef} isOpen={isSearchOpen} query={query} onQueryChange={setQuery} onOpen={() => setIsSearchOpen(true)} onClose={() => setIsSearchOpen(false)} onSelectPage={selectPage} />
      <div className="flex min-h-0 flex-1">
        <HelpSidebar activePage={activePage} onSelectPage={selectPage} onScroll={onNavScroll} restoreScroll={restoreNavScroll} />
        <div ref={restoreContentScroll} className="min-w-0 flex-1 overflow-y-auto bg-background px-6 py-8 lg:px-10" onScroll={(event) => onContentScroll(event.currentTarget.scrollTop)}>
          <div className="mx-auto max-w-4xl">{children}</div>
          <div className="mt-10 border-t pt-6 xl:hidden">
            <h2 className="mb-3 text-xs tracking-[0.14em] text-muted-foreground">related pages</h2>
            <div className="flex flex-wrap gap-2">
              {(HELP_CONTENT.find((entry) => entry.id === activePage)?.related ?? []).map((pageId) => {
                const entry = HELP_CONTENT.find((item) => item.id === pageId)
                return entry ? <button key={pageId} type="button" onClick={() => selectPage(pageId)} className="rounded-md border border-[var(--docs-accent-border)] bg-[var(--docs-accent-surface)] px-3 py-2 text-xs hover:bg-[var(--docs-accent-surface-strong)]">{entry.title}</button> : null
              })}
            </div>
          </div>
        </div>
        <HelpReferenceRail activePage={activePage} headings={headings} onSelectPage={selectPage} onSelectHeading={(id) => contentRef.current?.querySelector(`#${id}`)?.scrollIntoView({ block: 'start' })} />
      </div>
    </div>
  )
}
