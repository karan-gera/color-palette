import { useState } from 'react'
import { X, Copy, Link, Download, Upload, Eye, BarChart3, Keyboard, Sparkles, Type, Blend, Pipette, CheckCircle2, XCircle, Pencil, RefreshCw, Trash2, Plus, Sun, Moon, Circle, Undo2, Redo2 } from 'lucide-react'
import { SHORTCUT_GROUPS } from '@/hooks/useKeyboardShortcuts'
import { getModifierLabel } from '@/helpers/platform'
import AddColor from './AddColor'
import PaletteItem from './PaletteItem'
import PresetBrowser from './PresetBrowser'
import GlobalColorRelationshipSelector from './GlobalColorRelationshipSelector'
import ContrastChecker from './ContrastChecker'
import { generateTints, generateShades, generateTones, COLOR_RELATIONSHIPS, PALETTE_PRESETS } from '@/helpers/colorTheory'
import { EXPORT_FORMATS } from '@/helpers/exportFormats'

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
  { icon: Link, label: 'share via url', desc: 'palettes encoded in shareable links' },
  { icon: Download, label: 'export', desc: 'css, json, tailwind, scss, ase, aco, gpl, procreate, paint.net' },
  { icon: Eye, label: 'color blindness', desc: 'deuteranopia, protanopia, tritanopia, achromatopsia' },
  { icon: BarChart3, label: 'contrast checker', desc: 'wcag aa/aaa/aa18 for all color pairs' },
  { icon: Sparkles, label: 'presets', desc: 'pastel, neon, earth, jewel, monochrome, warm, cool, muted' },
  { icon: Type, label: 'color naming', desc: '4,000+ names matched by oklab distance' },
  { icon: Blend, label: 'variations', desc: 'tints, shades, tones' },
  { icon: Pipette, label: 'color picker', desc: 'eyedropper or os picker' },
  { icon: Keyboard, label: 'keyboard', desc: 'every action has a shortcut' },
]

const COMPETITOR_ROWS = [
  { feature: 'max colors', us: '10', coolors: '5 free, ∞ pro ($3.49/mo)', colorffy: '5' },
  { feature: 'contrast checker', us: true, coolors: 'pro', colorffy: 'pro ($5/mo)' },
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
    version: '0.13',
    title: 'image export, oklch picker, polish',
    items: [
      'png/svg image export with grid layout and hex labels (⇧⌘E)',
      'oklch color picker mode — toggle between hsl and perceptually uniform oklch',
      'rearrange mode (M key) replaces drag-to-reorder for cleaner ux',
      'cvd filter no longer rasterizes ui — applies only to color circles with crossfade',
      'smooth fade transition when loading saved palettes',
      'cleaner share urls using hyphen separator',
      'many bug fixes: keyboard accessibility, zoom overflow, platform-specific issues',
    ],
  },
  {
    version: '0.12',
    title: 'expand to 10 colors',
    items: [
      'palette now supports up to 10 colors (was 5)',
      'two-row layout: 3+3, 4+3, 4+4, 5+4, 5+5 split patterns',
      'position-to-position animations via framer motion',
      'drag-to-reorder extended to work across both rows',
      'shortcuts 6–9 and 0 for positions 6–10',
    ],
  },
  {
    version: '0.11',
    title: 'edit mode & workflow docs',
    items: [
      'dedicated edit mode help page',
      'agents.md workflow style guide added',
      'full vitest test suite with 206 tests',
    ],
  },
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
      'V → 1-9, 0 leader key chord',
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
          free color palette tool. no accounts, no ads, no paywalls. everything runs in your browser
          and stays on your device.
        </p>
        <p className="text-muted-foreground/50 text-[10px]">missing something? request it.</p>
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
                    {us === true ? <CheckCircle2 className="size-3.5 mx-auto text-green-500" /> : <span className="text-green-500 font-medium">{us}</span>}
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
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center">free forever</h3>
          <div className="max-w-lg mx-auto space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              no feature gates. no trial periods. no "upgrade to unlock." the tool works offline and costs nothing.
            </p>
            <p>
              donations welcome if you find it useful, but you'll never hit a paywall.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center">your data stays yours</h3>
          <div className="max-w-lg mx-auto space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              everything is stored in your browser's local storage. we don't have servers, accounts, or analytics.
              your palettes never leave your device unless you export them yourself.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center">no ai</h3>
          <div className="max-w-lg mx-auto space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              every color and calculation is deterministic. color theory math, not black boxes.
            </p>
            <p className="text-xs opacity-70">
              (this project was built with ai programming assistance. ai helped write the code, but nothing
              ai-powered runs in the product.)
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
  { type: 'page', id: 'undo-redo', label: 'undo & redo' },
  { type: 'page', id: 'relationships', label: 'color relationships' },
  { type: 'page', id: 'presets', label: 'presets' },
  { type: 'section', label: 'storage' },
  { type: 'page', id: 'save-open', label: 'save & open' },
  { type: 'page', id: 'backup', label: 'import / export palettes' },
  { type: 'section', label: 'copy & share' },
  { type: 'page', id: 'copy-formats', label: 'copy formats' },
  { type: 'page', id: 'share', label: 'share via url' },
  { type: 'section', label: 'export' },
  { type: 'page', id: 'export', label: 'export' },
  { type: 'section', label: 'color tools' },
  { type: 'page', id: 'edit-mode', label: 'edit mode' },
  { type: 'page', id: 'color-picker', label: 'color picker' },
  { type: 'page', id: 'color-naming', label: 'color naming' },
  { type: 'page', id: 'variations', label: 'variations' },
  { type: 'section', label: 'accessibility' },
  { type: 'page', id: 'color-blindness', label: 'color blindness' },
  { type: 'page', id: 'contrast', label: 'contrast checker' },
  { type: 'section', label: 'reference' },
  { type: 'page', id: 'theme', label: 'theme' },
  { type: 'page', id: 'keyboard', label: 'keyboard shortcuts' },
]

type DocPageId = string

/* ---- Doc page utilities ---- */

const noop = () => {}

function Demo({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="border rounded-lg p-4 bg-card/30 my-4 overflow-hidden">
      {label && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 block">{label}</span>
      )}
      <div className="flex justify-center items-center pointer-events-none select-none">
        {children}
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center bg-card border rounded px-1.5 py-0.5 text-[11px] font-mono mx-0.5">{children}</kbd>
  )
}

function DocArticle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="space-y-6">
      <h2 className="text-lg font-medium tracking-tight lowercase">{title}</h2>
      {children}
    </article>
  )
}

function ContrastDemo() {
  return (
    <ContrastChecker
      colors={['#e74c3c', '#3498db', '#2ecc71']}
      expanded={true}
      onToggle={noop}
    />
  )
}

function DocPageContent({ pageId }: { pageId: DocPageId }) {
  const navItem = DOC_NAV.find((i) => i.type === 'page' && i.id === pageId)
  const title = navItem?.type === 'page' ? navItem.label : pageId.replace(/-/g, ' ')

  switch (pageId) {
    case 'getting-started':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              click the <Plus className="size-3 inline" /> to add your first color.
            </p>
          </div>

          <Demo label="add a color">
            <AddColor onAdd={noop} />
          </Demo>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              each click adds a random color. max 10 colors. press <Kbd>A</Kbd> or <Kbd>space</Kbd> as a shortcut.
            </p>
            <p>
              each color can be locked, rerolled, edited, deleted, or expanded into variations. buttons below each circle, or use keyboard shortcuts.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">quick reference</span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Kbd>A</Kbd>
                <span className="text-muted-foreground">add a color</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>R</Kbd>
                <span className="text-muted-foreground">reroll all unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>1</Kbd>–<Kbd>9</Kbd>, <Kbd>0</Kbd>
                <span className="text-muted-foreground">lock / unlock color</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>S</Kbd>
                <span className="text-muted-foreground">save palette</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>Z</Kbd>
                <span className="text-muted-foreground">undo</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>C</Kbd>
                <span className="text-muted-foreground">copy share link</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              everything stays in your browser. save to local storage, share via url, or export to files. press <Kbd>/</Kbd> for all shortcuts.
            </p>
          </div>
        </DocArticle>
      )

    case 'palette':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              each color is a circle with controls below it. max 10 colors.
            </p>
          </div>

          <Demo label="palette color">
            <PaletteItem
              color="#e74c3c"
              isLocked={false}
              isEditing={false}
              onEditStart={noop}
              onEditSave={noop}
              onEditCancel={noop}
              onReroll={noop}
              onDelete={noop}
              onToggleLock={noop}
              onViewVariations={noop}
            />
          </Demo>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">locking</h3>
            <p>
              click a circle to toggle its lock. locked colors stay put when you reroll. press <Kbd>1</Kbd>–<Kbd>9</Kbd>, <Kbd>0</Kbd> to lock/unlock by position.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">action buttons</h3>
            <p>below each color circle, four buttons:</p>
            <ul className="space-y-1.5 list-none">
              <li className="flex items-center gap-2">
                <Pencil className="size-3 shrink-0" />
                <span><span className="text-foreground">edit</span> — type a hex value directly. the circle previews your input live.</span>
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="size-3 shrink-0" />
                <span><span className="text-foreground">reroll</span> — generate a new color (respects the current color relationship). disabled when locked.</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="size-3 shrink-0" />
                <span><span className="text-foreground">delete</span> — remove from palette.</span>
              </li>
              <li className="flex items-center gap-2">
                <Blend className="size-3 shrink-0" />
                <span><span className="text-foreground">variations</span> — explore tints, shades, and tones of this color.</span>
              </li>
            </ul>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">inline editing</h3>
            <p>
              click the pencil or press <Kbd>{getModifierLabel('shift')}</Kbd><Kbd>{getModifierLabel('alt')}</Kbd><Kbd>1</Kbd>–<Kbd>9</Kbd>, <Kbd>0</Kbd>. type a hex code — the circle updates live as you type. press <Kbd>enter</Kbd> to confirm or <Kbd>esc</Kbd> to cancel. on chromium browsers, a <Pipette className="size-3 inline" /> pipette icon lets you pick a color from anywhere on screen.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">hsl picker</h3>
            <p>
              while editing, click the small dot next to the hex input to open the hsl picker popover. three gradient sliders let you adjust hue (0–360°), saturation (0–100%), and lightness (0–100%) visually. changes sync live with the hex input — adjust a slider and the hex updates, type a hex and the sliders follow.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">hex code</h3>
            <p>
              click the hex code below any color to open the copy menu with 6 formats. see the <span className="text-foreground">copy formats</span> page for details.
            </p>
          </div>
        </DocArticle>
      )

    case 'undo-redo':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              adding, deleting, rerolling, editing, reordering, and loading presets are all tracked. made a mistake? step back.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">shortcuts</span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Kbd>Z</Kbd>
                <span className="text-muted-foreground flex items-center gap-1"><Undo2 className="size-3" /> undo</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>{getModifierLabel('shift')}</Kbd><Kbd>Z</Kbd>
                <span className="text-muted-foreground flex items-center gap-1"><Redo2 className="size-3" /> redo</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">how it works</h3>
            <p>
              linear stack. each change pushes a snapshot. undo goes back, redo goes forward.
            </p>
            <p>
              if you undo and then make a new change, the undone entries are discarded. standard text editor behavior.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">what gets tracked</h3>
            <ul className="space-y-1.5 list-none text-sm">
              <li className="flex items-start gap-2">
                <Plus className="size-3 shrink-0 mt-1" />
                <span>adding or deleting a color</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="size-3 shrink-0 mt-1" />
                <span>rerolling a single color or the entire palette</span>
              </li>
              <li className="flex items-start gap-2">
                <Pencil className="size-3 shrink-0 mt-1" />
                <span>editing a color's hex value (confirmed with enter)</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="size-3 shrink-0 mt-1" />
                <span>applying a preset or loading a saved palette</span>
              </li>
              <li className="flex items-start gap-2">
                <Blend className="size-3 shrink-0 mt-1" />
                <span>replacing a color from the variations panel</span>
              </li>
            </ul>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">what isn't tracked</h3>
            <p>
              lock/unlock states, theme changes, and ui toggles (contrast panel, cvd mode) are not part of the undo history — they're view settings, not palette data.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">session only</h3>
            <p>
              history resets on page reload. save (<Kbd>S</Kbd>) to keep a palette.
            </p>
          </div>
        </DocArticle>
      )

    case 'relationships':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              relationships control how new colors are generated relative to your locked colors (or the last color if none are locked).
            </p>
          </div>

          <Demo label="relationship selector">
            <GlobalColorRelationshipSelector
              currentRelationship="complementary"
              onRelationshipChange={noop}
              onGlobalReroll={noop}
            />
          </Demo>

          <div className="border rounded-lg overflow-hidden my-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">modes</div>
            <div className="divide-y divide-border">
              {COLOR_RELATIONSHIPS.map((rel) => (
                <div key={rel.value} className="px-4 py-2.5 flex items-baseline gap-3">
                  <span className="text-xs font-mono font-medium lowercase w-36 shrink-0">{rel.label}</span>
                  <span className="text-xs text-muted-foreground">{rel.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              press <Kbd>Q</Kbd> to cycle modes. changing mode rerolls unlocked colors.
            </p>
            <p>
              "reroll all" regenerates unlocked colors. locked colors act as anchors.
            </p>
          </div>
        </DocArticle>
      )

    case 'presets':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              presets generate palettes within curated hsl ranges. pick a mood without choosing individual colors.
            </p>
          </div>

          <Demo label="preset browser">
            <PresetBrowser
              activePresetId="pastel"
              onSelect={noop}
              onReroll={noop}
            />
          </Demo>

          <div className="border rounded-lg overflow-hidden my-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">available presets</div>
            <div className="divide-y divide-border">
              {PALETTE_PRESETS.map((preset) => (
                <div key={preset.id} className="px-4 py-2.5 flex items-baseline gap-3">
                  <span className="text-xs font-mono font-medium lowercase w-24 shrink-0">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              arrow buttons cycle presets, or press <Kbd>P</Kbd>. hover the label for a dropdown and reroll button (<Kbd>{getModifierLabel('shift')}</Kbd><Kbd>P</Kbd>).
            </p>
            <p>
              locked colors trigger a confirmation dialog since presets replace everything.
            </p>
            <p>
              if you edit a color outside the preset's hsl ranges, the label fades back to "presets."
            </p>
          </div>
        </DocArticle>
      )

    case 'copy-formats':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              click any hex code to open a dropdown. click a format to copy. green checkmark confirms.
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden my-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">formats</div>
            <div className="divide-y divide-border">
              {[
                { label: 'HEX', example: '#e74c3c' },
                { label: 'RGB', example: 'rgb(231, 76, 60)' },
                { label: 'HSL', example: 'hsl(6, 78%, 57%)' },
                { label: 'CSS Variable', example: '--color-primary: #e74c3c;' },
                { label: 'Tailwind', example: "'primary': '#e74c3c'" },
                { label: 'SCSS', example: '$color-primary: #e74c3c;' },
              ].map(({ label, example }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono font-medium">{label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{example}</span>
                  </div>
                  <Copy className="size-3.5 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">css named colors</h3>
            <p>
              if your color is close to a css named color (<code className="text-xs bg-muted px-1 rounded">coral</code>, <code className="text-xs bg-muted px-1 rounded">tomato</code>, etc.), an extra option appears to copy the name.
            </p>
          </div>
        </DocArticle>
      )

    case 'share':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              press <Kbd>C</Kbd> or click share to copy a link. the url encodes colors and lock states.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">example url</span>
            <div className="font-mono text-xs text-muted-foreground break-all bg-muted/50 rounded px-3 py-2">
              https://example.com/?colors=e74c3c,3498db,2ecc71&locked=100
            </div>
            <div className="text-[10px] text-muted-foreground space-y-1">
              <p><span className="text-foreground font-medium">colors</span> — comma-separated hex values (no # prefix)</p>
              <p><span className="text-foreground font-medium">locked</span> — binary string (1 = locked, 0 = unlocked)</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              shared links load automatically and clear the url. colors start locked so accidental rerolls don't change what the sender intended.
            </p>
          </div>
        </DocArticle>
      )

    case 'export':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              press <Kbd>E</Kbd> to export your palette for code or creative apps.
            </p>
          </div>

          <div className="space-y-4 my-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2 flex items-center gap-2">
                <Copy className="size-3" />
                code formats — copied to clipboard
              </div>
              <div className="divide-y divide-border">
                {EXPORT_FORMATS.filter(f => f.category === 'code').map((format) => (
                  <div key={format.value} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-mono font-medium lowercase">{format.label}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{format.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2 flex items-center gap-2">
                <Download className="size-3" />
                art app formats — downloaded as files
              </div>
              <div className="divide-y divide-border">
                {EXPORT_FORMATS.filter(f => f.category === 'art').map((format) => {
                  const appNames: Record<string, string> = {
                    photoshop: 'photoshop / illustrator',
                    procreate: 'procreate',
                    clipstudio: 'clip studio paint',
                    gimp: 'gimp',
                    krita: 'krita',
                    paintnet: 'paint.net',
                  }
                  return (
                    <div key={format.value} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono font-medium lowercase">{format.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          .{format.extension} — {format.compatibleApps.map(id => appNames[id] ?? id).join(', ')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              art app files include "how to use" import instructions.
            </p>
            <p>
              <Kbd>↑</Kbd><Kbd>↓</Kbd> to navigate, <Kbd>enter</Kbd> to export. format not listed? click any hex code to copy individually.
            </p>
          </div>
        </DocArticle>
      )

    case 'color-picker':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              press <Kbd>I</Kbd> to pick a color from your screen.
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden my-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">browser support</div>
            <div className="divide-y divide-border">
              <div className="px-4 py-2.5">
                <span className="text-xs font-mono font-medium lowercase">chromium</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  native eyedropper api — click anywhere on your screen to sample a color. works in chrome, edge, arc, brave, and opera.
                </p>
              </div>
              <div className="px-4 py-2.5">
                <span className="text-xs font-mono font-medium lowercase">firefox / safari</span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  falls back to the os color picker dialog. pick from the system palette or enter values manually.
                </p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">per-color picking</h3>
            <p>
              in edit mode, a <Pipette className="size-3 inline" /> pipette appears on chromium. click to replace the color with a screen pick.
            </p>
            <p>
              toolbar picker disabled at 10 colors.
            </p>
          </div>
        </DocArticle>
      )

    case 'color-naming':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              each color shows its closest name from a 4,000+ entry database.
            </p>
          </div>

          <Demo label="color with name">
            <PaletteItem
              color="#e74c3c"
              isLocked={false}
              isEditing={false}
              onEditStart={noop}
              onEditSave={noop}
              onEditCancel={noop}
              onReroll={noop}
              onDelete={noop}
              onToggleLock={noop}
              onViewVariations={noop}
            />
          </Demo>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">how it works</h3>
            <p>
              oklab distance matching. equal numeric distances = equal perceived differences.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">css named colors</h3>
            <p>
              if close to a css named color, a tooltip shows the name on hover. also available in the copy menu.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">data source</h3>
            <p>
              <code className="text-xs bg-muted px-1 rounded">color-name-list/bestof</code> (mit). no pantone — proprietary.
            </p>
          </div>
        </DocArticle>
      )

    case 'variations':
      return (
        <DocArticle title={title}>
          {(() => {
            const sourceColor = '#3498db'
            const tints = generateTints(sourceColor)
            const shades = generateShades(sourceColor)
            const tones = generateTones(sourceColor)

            return (
              <>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
                  <p>
                    click <Blend className="size-3 inline" /> or press <Kbd>V</Kbd> then <Kbd>1</Kbd>–<Kbd>9</Kbd>, <Kbd>0</Kbd> (within 500ms) to see tints, shades, and tones.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-4">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">variations of {sourceColor}</span>
                  {[
                    { label: 'tints', desc: 'lighter — lightness increased toward white', colors: tints },
                    { label: 'shades', desc: 'darker — lightness decreased toward black', colors: shades },
                    { label: 'tones', desc: 'muted — saturation decreased toward gray', colors: tones },
                  ].map(({ label, desc, colors: swatches }) => (
                    <div key={label} className="space-y-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-medium lowercase">{label}</span>
                        <span className="text-[10px] text-muted-foreground">{desc}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div
                          className="size-8 rounded-lg border-2 border-foreground/20 ring-2 ring-foreground/10 shrink-0"
                          style={{ backgroundColor: sourceColor }}
                          title="source"
                        />
                        {swatches.map((hex, i) => (
                          <div
                            key={i}
                            className="size-8 rounded-lg border border-border/50 shrink-0"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
                  <p>
                    click a swatch to replace the palette color. shift+click to copy hex. <Kbd>esc</Kbd> to go back.
                  </p>
                  <p>
                    source color has a thick border. 9 variations per row, interpolated in hsl.
                  </p>
                </div>
              </>
            )
          })()}
        </DocArticle>
      )

    case 'color-blindness':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              simulates how people with color vision deficiencies see your palette. applies to the entire page.
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden my-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">simulation modes</div>
            <div className="divide-y divide-border">
              {[
                { label: 'deuteranopia', desc: 'reduced green sensitivity — the most common form of color blindness, affecting ~6% of males. reds and greens appear similar.' },
                { label: 'protanopia', desc: 'reduced red sensitivity — reds appear darker and shift toward brown/green. similar prevalence to deuteranopia.' },
                { label: 'tritanopia', desc: 'reduced blue sensitivity — rare. blues and yellows become difficult to distinguish.' },
                { label: 'achromatopsia', desc: 'complete color blindness — everything appears in grayscale. very rare, affecting ~0.003% of the population.' },
              ].map(({ label, desc }) => (
                <div key={label} className="px-4 py-2.5">
                  <span className="text-xs font-mono font-medium lowercase">{label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">switching modes</h3>
            <p>
              <Kbd>{getModifierLabel('shift')}</Kbd><Kbd>T</Kbd> cycles modes. header toggle: <Eye className="size-3 inline" /> normal, <span className="font-medium text-foreground">D</span>/<span className="font-medium text-foreground">P</span>/<span className="font-medium text-foreground">T</span>/<span className="font-medium text-foreground">A</span> for each type. persists across sessions.
            </p>
            <p>
              svg color matrix filters from viénot 1999 and brettel 1997.
            </p>
          </div>
        </DocArticle>
      )

    case 'contrast':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              press <Kbd>K</Kbd> to check wcag contrast ratios.
            </p>
          </div>

          <Demo label="contrast checker">
            <ContrastDemo />
          </Demo>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">wcag levels</span>
            <div className="space-y-2 text-sm">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-medium w-12 shrink-0">aaa</span>
                <span className="text-muted-foreground">7:1+ contrast ratio — enhanced readability, recommended for body text</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-medium w-12 shrink-0">aa</span>
                <span className="text-muted-foreground">4.5:1+ — minimum for normal-sized text (under 18pt)</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-medium w-12 shrink-0">aa18</span>
                <span className="text-muted-foreground">3:1+ — minimum for large text (18pt+ regular or 14pt+ bold)</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">vs backgrounds</h3>
            <p>
              tests each color against light, gray, and dark backgrounds. shows contrast ratio and wcag level.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">vs each other</h3>
            <p>
              matrix of all color pairs. needs 2+ colors.
            </p>

            <p>
              <Kbd>{getModifierLabel('shift')}</Kbd><Kbd>K</Kbd> switches tabs.
            </p>
          </div>
        </DocArticle>
      )

    case 'save-open':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              saved to browser local storage. no accounts, no server.
            </p>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">saving</h3>
            <p>
              <Kbd>S</Kbd> opens save dialog. name optional (defaults to timestamp). each save creates a new entry.
            </p>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">opening</h3>
            <p>
              <Kbd>O</Kbd> shows saved palettes with names, timestamps, and swatches.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">open dialog</span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Kbd>↑</Kbd><Kbd>↓</Kbd>
                <span className="text-muted-foreground">navigate the list</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>enter</Kbd>
                <span className="text-muted-foreground">load selected palette</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>del</Kbd>
                <span className="text-muted-foreground">delete selected palette</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>esc</Kbd>
                <span className="text-muted-foreground">close dialog</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              double-click to load. loaded colors start locked to prevent accidental rerolls.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">storage</span>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <code className="text-xs bg-muted px-1 rounded">localStorage</code> under <code className="text-xs bg-muted px-1 rounded">color-palette:saved</code>. persists across sessions but browser/domain specific. back up with import/export.
              </p>
            </div>
          </div>
        </DocArticle>
      )

    case 'backup':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              back up your collection to json or restore from another browser. buttons in the open dialog footer (<Kbd>O</Kbd>).
            </p>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">exporting</h3>
            <p>
              <Download className="size-3 inline" /> downloads all saved palettes as <code className="text-xs bg-muted px-1 rounded">.json</code>.
            </p>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">importing</h3>
            <p>
              <Upload className="size-3 inline" /> merges a <code className="text-xs bg-muted px-1 rounded">.json</code> file with your collection. duplicates skipped.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">file format</span>
            <pre className="font-mono text-[10px] text-muted-foreground bg-muted/50 rounded p-3 overflow-x-auto whitespace-pre">{`{
  "version": "1.0",
  "exportedAt": "2025-01-15T12:00:00.000Z",
  "palettes": [
    {
      "id": "a1b2c3d4-...",
      "name": "sunset palette",
      "colors": ["#e74c3c", "#e67e22", "#f1c40f"],
      "savedAt": "2025-01-14T09:30:00.000Z"
    }
  ]
}`}</pre>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              different from <Kbd>E</Kbd> export (current palette to code/art formats). this is for your saved collection.
            </p>
          </div>
        </DocArticle>
      )

    case 'theme':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              three themes. <Kbd>T</Kbd> cycles, or use the toggle.
            </p>
          </div>

          <div className="border rounded-lg overflow-hidden my-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pt-3 pb-2">themes</div>
            <div className="divide-y divide-border">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="size-8 rounded-full border border-border" style={{ backgroundColor: '#fafafa' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <Sun className="size-3 text-muted-foreground" />
                    <span className="text-xs font-mono font-medium lowercase">light</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">off-white background, dark text. good for bright environments.</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="size-8 rounded-full border border-border" style={{ backgroundColor: '#8a8a8a' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <Circle className="size-3 text-muted-foreground" />
                    <span className="text-xs font-mono font-medium lowercase">gray</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">50% neutral gray background, light text. balanced for color accuracy — colors aren't biased by a very light or dark surround.</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="size-8 rounded-full border border-border" style={{ backgroundColor: '#1f1f1f' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <Moon className="size-3 text-muted-foreground" />
                    <span className="text-xs font-mono font-medium lowercase">dark</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">near-black background, light text. reduces eye strain in low-light conditions.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">auto-detection</h3>
            <p>
              first visit uses os <code className="text-xs bg-muted px-1 rounded">prefers-color-scheme</code>. manual switch saves to local storage.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">contrast checker</h3>
            <p>
              "vs backgrounds" tests all three themes regardless of which is active.
            </p>
          </div>
        </DocArticle>
      )

    case 'edit-mode':
      return (
        <DocArticle title={title}>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>
              edit mode lets you change any color's exact value — with live preview, hsl sliders, and per-color screen picking. it's the most precise way to control a specific color in your palette.
            </p>
          </div>

          <Demo label="color in edit mode">
            <PaletteItem
              color="#e74c3c"
              isLocked={false}
              isEditing={true}
              onEditStart={noop}
              onEditSave={noop}
              onEditCancel={noop}
              onReroll={noop}
              onDelete={noop}
              onToggleLock={noop}
              onViewVariations={noop}
            />
          </Demo>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">entering edit mode</h3>
            <p>two ways to open edit mode for a color:</p>
            <ul className="space-y-1.5 list-none">
              <li className="flex items-center gap-2">
                <Pencil className="size-3 shrink-0" />
                <span>click the pencil icon below any color circle</span>
              </li>
              <li className="flex items-center gap-2 flex-wrap gap-y-1">
                <span className="flex items-center"><Kbd>{getModifierLabel('shift')}</Kbd><Kbd>{getModifierLabel('alt')}</Kbd><Kbd>1</Kbd>–<Kbd>9</Kbd>, <Kbd>0</Kbd></span>
                <span className="text-muted-foreground">keyboard shortcut (number = color position)</span>
              </li>
            </ul>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">hex input</h3>
            <p>
              type a 3- or 6-character hex code (with or without <code className="text-xs bg-muted px-1 rounded">#</code>). the color circle updates live as you type. only a confirmed edit is saved — the original color is kept in memory until you press <Kbd>enter</Kbd>.
            </p>
            <p>
              if your input is not a valid hex color, the input flashes red and edit mode stays open. nothing is committed. press <Kbd>esc</Kbd> or click away to discard.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">hsl picker</h3>
            <p>
              click the small colored dot to the right of the hex input to open the hsl picker popover. three gradient sliders let you adjust:
            </p>
            <div className="border rounded-lg overflow-hidden my-2">
              <div className="divide-y divide-border">
                {[
                  { label: 'hue', desc: '0–360° along the color wheel — changes the base color family' },
                  { label: 'saturation', desc: '0% (gray) to 100% (fully vivid)' },
                  { label: 'lightness', desc: '0% (black) to 100% (white)' },
                ].map(({ label, desc }) => (
                  <div key={label} className="px-4 py-2.5">
                    <span className="text-xs font-mono font-medium">{label}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <p>
              sliders and the hex input stay in sync — drag a slider and the hex updates instantly; type a hex and the sliders follow. close the picker by clicking the dot again or clicking away.
            </p>

            <h3 className="text-sm font-medium text-foreground lowercase mt-4">pipette (chromium only)</h3>
            <p>
              on chromium browsers (chrome, edge, arc, brave), a <Pipette className="size-3 inline" /> pipette icon appears to the left of the dot. click it to launch the native eyedropper — then click anywhere on your screen to sample a color. the sampled hex fills the input and the circle updates immediately.
            </p>
            <p>
              on firefox and safari this icon is hidden (the toolbar pick button uses the os color picker instead).
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card/30 my-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">confirming and cancelling</span>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Kbd>enter</Kbd>
                <span className="text-muted-foreground">confirm — apply the color and push to undo history</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>esc</Kbd>
                <span className="text-muted-foreground">cancel — discard changes and restore the original</span>
              </div>
              <div className="text-[10px] text-muted-foreground/70 pt-1">clicking outside the editor also cancels without committing</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <h3 className="text-sm font-medium text-foreground lowercase">undo behavior</h3>
            <p>
              typing and slider adjustments are not tracked individually. only a confirmed edit (<Kbd>enter</Kbd>) is pushed onto the undo stack — so you can explore freely and then either commit or discard. cancelling never creates an undo entry.
            </p>
          </div>
        </DocArticle>
      )

    default:
      return (
        <article className="space-y-6">
          <h2 className="text-lg font-medium tracking-tight lowercase">{title}</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3 max-w-prose">
            <p>documentation for this page is coming soon.</p>
          </div>
        </article>
      )
  }
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
