import { useState } from 'react'
import { X, Copy, Link, Download, Eye, BarChart3, Keyboard, Sparkles, Type, Blend, Pipette, CheckCircle2, XCircle } from 'lucide-react'
import { SHORTCUT_GROUPS } from '@/hooks/useKeyboardShortcuts'
import { getModifierLabel } from '@/helpers/platform'

type DocsOverlayProps = {
  visible: boolean
  onClose: () => void
}

type Tab = 'about' | 'help' | 'changelog'

const TABS: { id: Tab; label: string }[] = [
  { id: 'about', label: 'about' },
  { id: 'help', label: 'help' },
  { id: 'changelog', label: 'changelog' },
]

const FEATURES = [
  { icon: Copy, label: 'copy formats', desc: 'hex, rgb, hsl, css, tailwind, scss' },
  { icon: Link, label: 'share via url', desc: 'encode palettes in shareable links' },
  { icon: Download, label: 'export', desc: 'css, json, tailwind, scss, ase, aco, gpl, procreate, paint.net' },
  { icon: Eye, label: 'color blindness', desc: 'deuteranopia, protanopia, tritanopia, achromatopsia simulation' },
  { icon: BarChart3, label: 'contrast checker', desc: 'wcag aa/aaa/aa18 compliance for all color pairs' },
  { icon: Sparkles, label: 'presets', desc: 'pastel, neon, earth, jewel, monochrome, warm, cool, muted' },
  { icon: Type, label: 'color naming', desc: '4,000+ names via oklab nearest-neighbor matching' },
  { icon: Blend, label: 'variations', desc: 'tints, shades, and tones for any color' },
  { icon: Pipette, label: 'color picker', desc: 'eyedropper (chromium) or os color picker (firefox/safari)' },
  { icon: Keyboard, label: 'full keyboard', desc: 'every action reachable without a mouse' },
]

const COMPETITOR_ROWS = [
  { feature: 'contrast checker', us: true, coolors: 'pro ($3.49/mo)', colorffy: 'pro ($5/mo)' },
  { feature: 'palette variations', us: true, coolors: 'pro', colorffy: 'free (limited)' },
  { feature: 'advanced exports', us: true, coolors: 'pro', colorffy: 'pro' },
  { feature: 'dark mode', us: true, coolors: 'pro', colorffy: 'free' },
  { feature: 'unlimited saves', us: true, coolors: 'pro', colorffy: 'pro' },
  { feature: 'cvd simulation', us: true, coolors: 'free', colorffy: 'n/a' },
  { feature: 'color naming', us: true, coolors: 'free', colorffy: 'n/a' },
  { feature: 'keyboard coverage', us: true, coolors: 'partial', colorffy: 'n/a' },
  { feature: 'art app exports', us: true, coolors: 'n/a', colorffy: 'n/a' },
  { feature: 'no ads', us: true, coolors: 'pro', colorffy: 'pro' },
]

const CHANGELOG = [
  {
    version: '0.10',
    title: 'eyedropper / color picker',
    items: [
      'native eyedropper api on chromium browsers',
      'os color picker fallback on firefox/safari',
      'pipette icon in edit mode for per-color picking',
      'I keyboard shortcut',
    ],
  },
  {
    version: '0.9',
    title: 'color variations panel',
    items: [
      '9 tints, 9 shades, 9 tones per color',
      'distinct swatch shapes: rounded squares, diamonds, pentagons',
      'click to copy, shift+click to replace',
      'V → 1-5 leader key chord',
    ],
  },
  {
    version: '0.8',
    title: 'color naming',
    items: [
      'oklab nearest-neighbor lookup from 4,000+ curated names',
      'css named color tooltip when within threshold',
      'displayed on each palette item',
    ],
  },
  {
    version: '0.7',
    title: 'quick palette presets',
    items: [
      '8 preset styles: pastel, neon, earth, jewel, monochrome, warm, cool, muted',
      'P key to cycle, confirmation dialog for locked colors',
      'preset browser with arrow navigation and reroll',
    ],
  },
  {
    version: '0.6',
    title: 'keyboard shortcut overhaul',
    items: [
      'grouped layout with category labels',
      'os-aware modifier symbols (⇧/⌥ on mac, shift/alt on windows)',
      'full keyboard coverage: every action reachable',
    ],
  },
  {
    version: '0.5',
    title: 'contrast checker',
    items: [
      'wcag aa, aaa, aa18 compliance levels',
      'matrix view for all color pairs',
      'per-color cards vs theme backgrounds',
      'tabbed ui with crossfade animation',
    ],
  },
  {
    version: '0.4',
    title: 'color blindness preview',
    items: [
      'deuteranopia, protanopia, tritanopia, achromatopsia',
      'site-wide svg filter application',
      'circle wipe transition for theme, horizontal wipe for cvd',
    ],
  },
  {
    version: '0.3',
    title: 'export palette',
    items: [
      'code formats: css, json, tailwind, scss',
      'art app formats: ase, aco, procreate, gimp, paint.net',
      'tabbed dialog with per-app import instructions',
    ],
  },
  {
    version: '0.2',
    title: 'share via url',
    items: [
      'palette encoded in url params',
      'auto-load on page visit',
      'copy link button (C key)',
    ],
  },
  {
    version: '0.1',
    title: 'copy in multiple formats',
    items: [
      'hex, rgb, hsl, css variable, tailwind, scss',
      'dropdown menu on hex code click',
      'green checkmark on successful copy',
    ],
  },
]

function AboutTab() {
  return (
    <div className="space-y-12">
      {/* hero */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-medium tracking-tight lowercase">color palette generator</h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
          a free, open-source color palette tool with everything* competitors charge for.
          no accounts, no ads, no paywalls, just color theory math and keyboard shortcuts.
        </p>
        <p className="text-muted-foreground/50 text-[10px]">* are we missing something? request it!</p>
      </div>

      {/* feature grid */}
      <div>
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4 text-center">features</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-card border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <Icon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* competitor comparison */}
      <div>
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4 text-center">what we give free</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 text-muted-foreground font-normal">feature</th>
                <th className="text-center py-2 px-3 font-normal">us</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-normal">coolors</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-normal">colorffy</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITOR_ROWS.map(({ feature, us, coolors, colorffy }) => (
                <tr key={feature} className="border-b border-border/50">
                  <td className="py-2 pr-4">{feature}</td>
                  <td className="py-2 px-3 text-center">
                    {us && <CheckCircle2 className="size-3.5 mx-auto text-green-500" />}
                  </td>
                  <td className="py-2 px-3 text-center text-muted-foreground">
                    {coolors === 'n/a' ? <XCircle className="size-3.5 mx-auto text-red-500/70" /> : coolors === 'free' ? <CheckCircle2 className="size-3.5 mx-auto text-green-500" /> : coolors}
                  </td>
                  <td className="py-2 px-3 text-center text-muted-foreground">
                    {colorffy === 'n/a' ? <XCircle className="size-3.5 mx-auto text-red-500/70" /> : colorffy === 'free' ? <CheckCircle2 className="size-3.5 mx-auto text-green-500" /> : colorffy === 'free (limited)' ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3.5 text-green-500" /><span className="text-[10px]">(limited)</span></span> : colorffy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* philosophy */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center">philosophy</h3>
          <div className="max-w-lg mx-auto space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              every feature is free, forever. no feature gates, no trial periods, no "upgrade to unlock."
              the entire tool works offline, stores data locally, and costs nothing to use.
            </p>
            <p>
              if you find it useful, you can support development via donation, but you'll never be asked
              to pay for a feature that already exists.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center">on ai</h3>
          <div className="max-w-lg mx-auto space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              no generative ai features in the product. ever. every color, every calculation, every result
              is algorithmic and reproducible, color theory math, not black boxes.
            </p>
            <p className="text-xs opacity-70">
              transparency: this project was built with ai programming assistance.
              ai helped write the code, but no ai runs in the product. the user never interacts with a model.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Help / documentation structure */
type DocNavSection = { type: 'section'; label: string }
type DocNavPage = { type: 'page'; id: string; label: string }
type DocNavItem = DocNavSection | DocNavPage

const DOC_NAV: DocNavItem[] = [
  { type: 'section', label: 'basics' },
  { type: 'page', id: 'getting-started', label: 'getting started' },
  { type: 'page', id: 'palette', label: 'palette' },
  { type: 'page', id: 'relationships', label: 'color relationships' },
  { type: 'page', id: 'presets', label: 'presets' },
  { type: 'section', label: 'copy & share' },
  { type: 'page', id: 'copy-formats', label: 'copy formats' },
  { type: 'page', id: 'share', label: 'share via url' },
  { type: 'section', label: 'export' },
  { type: 'page', id: 'export', label: 'export' },
  { type: 'section', label: 'color tools' },
  { type: 'page', id: 'color-picker', label: 'color picker' },
  { type: 'page', id: 'color-naming', label: 'color naming' },
  { type: 'page', id: 'variations', label: 'variations' },
  { type: 'section', label: 'accessibility' },
  { type: 'page', id: 'color-blindness', label: 'color blindness' },
  { type: 'page', id: 'contrast', label: 'contrast checker' },
  { type: 'section', label: 'reference' },
  { type: 'page', id: 'keyboard', label: 'keyboard shortcuts' },
]

const DOC_PAGE_IDS = DOC_NAV
  .filter((item): item is DocNavPage => item.type === 'page')
  .map((p) => p.id)

type DocPageId = (typeof DOC_PAGE_IDS)[number]

function DocPageContent({ pageId }: { pageId: DocPageId }) {
  const navItem = DOC_NAV.find((i) => i.type === 'page' && i.id === pageId)
  const title = navItem?.type === 'page' ? navItem.label : pageId.replace(/-/g, ' ')
  return (
    <article className="space-y-6">
      <h2 className="text-lg font-medium tracking-tight lowercase">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
        <p>Add your documentation copy for this page.</p>
      </div>
    </article>
  )
}

function DocPageKeyboard() {
  return (
    <article className="space-y-6">
      <h2 className="text-lg font-medium tracking-tight lowercase">keyboard shortcuts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.label}>
            <h3 className="text-muted-foreground mb-2 font-medium">{group.label}</h3>
            <div className="space-y-1">
              {group.shortcuts.map((shortcut) => (
                <div key={shortcut.key + shortcut.description} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{shortcut.description}</span>
                  <span className="flex items-center gap-0.5 shrink-0 ml-2">
                    {shortcut.modifiers?.map((mod) => (
                      <kbd key={mod} className="bg-card border rounded px-1.5 py-0.5 text-[10px]">
                        {getModifierLabel(mod)}
                      </kbd>
                    ))}
                    <kbd className="bg-card border rounded px-1.5 py-0.5 text-[10px]">{shortcut.key}</kbd>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

function HelpTab() {
  const [activePage, setActivePage] = useState<DocPageId>('getting-started')

  return (
    <div className="flex flex-1 min-h-0 w-full">
      {/* sidebar */}
      <nav className="w-48 shrink-0 pr-4 border-r border-border overflow-y-auto">
        <ul className="space-y-0.5 py-1">
          {DOC_NAV.map((item, i) =>
            item.type === 'section' ? (
              <li key={i} className="pt-3 pb-1 first:pt-0">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  {item.label}
                </span>
              </li>
            ) : (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActivePage(item.id)}
                  className={`block w-full text-left py-1.5 px-2 rounded text-xs font-mono lowercase transition-colors ${
                    activePage === item.id
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            )
          )}
        </ul>
      </nav>

      {/* content */}
      <div className="flex-1 min-w-0 overflow-y-auto pl-6">
        {activePage === 'keyboard' ? (
          <DocPageKeyboard />
        ) : (
          <DocPageContent pageId={activePage} />
        )}
      </div>
    </div>
  )
}

function ChangelogTab() {
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <h3 className="text-xs text-muted-foreground uppercase tracking-widest text-center">changelog</h3>
      {CHANGELOG.map((entry) => (
        <div key={entry.version} className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">v{entry.version}</span>
            <span className="text-sm font-medium">{entry.title}</span>
          </div>
          <ul className="space-y-0.5 text-xs text-muted-foreground pl-4">
            {entry.items.map((item, i) => (
              <li key={i} className="before:content-['–'] before:mr-2 before:text-muted-foreground/50">{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default function DocsOverlay({ visible, onClose }: DocsOverlayProps) {
  const [activeTab, setActiveTab] = useState<Tab>('about')

  return (
    <div
      className={`fixed inset-0 z-[9997] bg-background transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex flex-col h-[calc(100vh-57px)] min-h-0">
        {activeTab === 'help' ? (
          <div className="flex-1 flex min-h-0 px-6 py-6">
            <HelpTab />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-8">
            <div className="max-w-3xl mx-auto">
              <div className={activeTab === 'about' ? '' : 'hidden'}>
                <AboutTab />
              </div>
              <div className={activeTab === 'changelog' ? '' : 'hidden'}>
                <ChangelogTab />
              </div>
            </div>
            <div className="h-16" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}
