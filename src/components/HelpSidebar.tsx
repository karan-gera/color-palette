import { HELP_CONTENT, HELP_SECTIONS } from './helpContentIndex'

type HelpSidebarProps = {
  activePage: string
  onSelectPage: (pageId: string) => void
  onScroll: (scrollTop: number) => void
  restoreScroll: (element: HTMLElement | null) => void
}

export default function HelpSidebar({ activePage, onSelectPage, onScroll, restoreScroll }: HelpSidebarProps) {
  return (
    <nav
      ref={restoreScroll}
      aria-label="help pages"
      className="hidden w-56 shrink-0 overflow-y-auto border-r bg-muted/25 px-4 py-5 md:block"
      onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
    >
      <p className="mb-5 text-[11px] tracking-[0.14em] text-muted-foreground">
        manual index / {HELP_CONTENT.length} pages
      </p>
      {HELP_SECTIONS.map((section, sectionIndex) => (
        <section key={section} className="mb-5" aria-labelledby={`help-section-${sectionIndex}`}>
          <h2 id={`help-section-${sectionIndex}`} className="mb-1.5 text-[11px] font-normal tracking-wide text-[#c9367b]">
            {section}
          </h2>
          <ul className="space-y-0.5">
            {HELP_CONTENT.filter((entry) => entry.section === section).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelectPage(entry.id)}
                  aria-current={activePage === entry.id ? 'page' : undefined}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-xs leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9367b] motion-reduce:transition-none ${
                    activePage === entry.id
                      ? 'bg-accent font-medium text-[#a52460]'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  }`}
                >
                  {entry.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
