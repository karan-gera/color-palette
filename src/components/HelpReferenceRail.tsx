import { getModifierLabel } from '@/helpers/platform'
import { getHelpEntry } from './helpContentIndex'

type HelpReferenceRailProps = {
  activePage: string
  headings: { id: string; label: string }[]
  onSelectPage: (pageId: string) => void
  onSelectHeading: (headingId: string) => void
}

function ShortcutKeys({ shortcut }: { shortcut: string }) {
  const label = shortcut
    .replaceAll('shift', getModifierLabel('shift'))
    .replaceAll('alt', getModifierLabel('alt'))
    .replaceAll('command', '⌘')
  return <kbd className="rounded border bg-background px-1.5 py-0.5 text-[11px]">{label}</kbd>
}

const SHORTCUT_LABELS: Record<string, string> = {
  a: 'add color', space: 'add color', r: 'reroll unlocked colors', q: 'cycle relationship', p: 'cycle preset',
  'shift+p': 'reroll preset', s: 'save palette', o: 'open palettes', c: 'copy share link', e: 'export',
  'shift+command+e': 'export image', g: 'cycle views', x: 'extract from image', f: 'open preview',
  i: 'pick color', y: 'toggle harmony score', k: 'toggle contrast', 'shift+k': 'change contrast view',
  t: 'cycle theme', 'shift+t': 'cycle color-vision mode', z: 'undo', 'shift+z': 'redo', '?': 'show shortcuts',
  '1-9, 0': 'toggle color lock', 'shift+alt+1-9, 0': 'edit a color', 'v then 1-9, 0': 'open variations',
}

export default function HelpReferenceRail({ activePage, headings, onSelectPage, onSelectHeading }: HelpReferenceRailProps) {
  const entry = getHelpEntry(activePage)
  const related = entry?.related?.map(getHelpEntry).filter((item) => item !== undefined) ?? []

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l bg-muted/15 px-5 py-5 xl:block" aria-label="page reference">
      {headings.length > 0 && (
        <nav aria-label="on this page" className="mb-7">
          <h2 className="mb-2 text-[11px] font-normal tracking-[0.14em] text-muted-foreground">on this page</h2>
          {headings.map((heading) => (
            <button key={heading.id} type="button" onClick={() => onSelectHeading(heading.id)} className="block py-1.5 text-left text-xs leading-5 text-muted-foreground hover:text-foreground">
              {heading.label}
            </button>
          ))}
        </nav>
      )}
      {entry?.shortcuts && entry.shortcuts.length > 0 && (
        <section className="mb-3 rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-lg leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>shortcuts on this page</h2>
          <div className="divide-y">
            {entry.shortcuts.map((shortcut) => (
              <div key={shortcut} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                <span>{SHORTCUT_LABELS[shortcut] ?? 'shortcut'}</span>
                <ShortcutKeys shortcut={shortcut} />
              </div>
            ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="rounded-lg border border-[var(--docs-accent-border)] bg-[var(--docs-accent-surface)] p-4">
          <h2 className="mb-2 text-[11px] font-normal tracking-[0.14em] text-[var(--docs-accent-text)]">related pages</h2>
          <div className="divide-y">
            {related.map((item) => (
              <button key={item.id} type="button" onClick={() => onSelectPage(item.id)} className="block w-full border-[var(--docs-accent-border)] py-2.5 text-left text-xs hover:text-[var(--docs-accent-text)]">
                {item.title} →
              </button>
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}
