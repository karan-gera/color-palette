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

function HelpTab() {
  return (
    <div className="space-y-10">
      {/* getting started */}
      <div>
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4 text-center">getting started</h3>
        <div className="max-w-lg mx-auto space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p><kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">shift+/</kbd> open docs</p>
          <p><kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">space</kbd> or <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">a</kbd> add a random color to the palette (up to 5)</p>
          <p><kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">r</kbd> reroll all unlocked colors</p>
          <p><kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">1</kbd>-<kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">5</kbd> toggle lock on individual colors</p>
          <p><kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">z</kbd> undo, <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">shift+z</kbd> redo</p>
          <p><kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">s</kbd> save palette, <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">o</kbd> open saved</p>
          <p>click any hex code below a color to copy in different formats.</p>
        </div>
      </div>

      {/* feature walkthroughs */}
      <div>
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4 text-center">features</h3>
        <div className="max-w-lg mx-auto space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div>
            <p className="text-foreground font-medium mb-1">color relationships</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">q</kbd> to cycle through modes: random, complementary, analogous, triadic, tetradic, split-complementary, monochromatic. new colors will follow the selected harmony.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">presets</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">p</kbd> to cycle through palette presets (pastel, neon, earth, jewel, etc.). <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">shift+p</kbd> rerolls the current preset. use the preset browser in the toolbar for direct selection.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">export</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">e</kbd> to export. code tab: css variables, json, tailwind, scss. art apps tab: photoshop (ase/aco), procreate, gimp/krita, paint.net, with import instructions for each.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">color blindness preview</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">shift+t</kbd> to cycle through cvd simulations. the entire ui is filtered so you can see exactly how your palette appears to people with color vision deficiencies.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">contrast checker</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">k</kbd> to toggle. shows wcag contrast ratios for your colors against theme backgrounds, and against each other. press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">shift+k</kbd> to cycle tabs.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">variations</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">v</kbd> then <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">1-5</kbd> to view tints, shades, and tones for a color. click a swatch to copy, shift+click to replace the palette color.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">color picker</p>
            <p>press <kbd className="bg-card border rounded px-1.5 py-0.5 text-xs">i</kbd> to pick a color from screen (chromium: eyedropper, firefox/safari: os color picker). also available in per-color edit mode next to the hsl slider toggle.</p>
          </div>
        </div>
      </div>

      {/* keyboard shortcuts */}
      <div>
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-4 text-center">all keyboard shortcuts</h3>
        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <h4 className="text-xs text-muted-foreground mb-2 font-medium">{group.label}</h4>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.key + shortcut.description} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{shortcut.description}</span>
                    <span className="flex items-center gap-0.5">
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
      <div className="overflow-y-auto h-[calc(100vh-57px)] px-6 py-8">
        <div className="max-w-3xl mx-auto">
        <div className={activeTab === 'about' ? '' : 'hidden'}>
          <AboutTab />
        </div>
        <div className={activeTab === 'help' ? '' : 'hidden'}>
          <HelpTab />
        </div>
        <div className={activeTab === 'changelog' ? '' : 'hidden'}>
          <ChangelogTab />
        </div>
        </div>

        {/* bottom spacer */}
        <div className="h-16" aria-hidden="true" />
      </div>
    </div>
  )
}
