import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, LayoutDashboard, Users, BarChart3, Settings } from 'lucide-react'
import { AreaChart, Area, XAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

type PreviewMode = 'mosaic' | 'ui' | 'title'
type TitleLayout = 'hero' | 'editorial' | 'poster'

type PalettePreviewOverlayProps = {
  palette: string[]
  onClose: () => void
}

const MODES: Array<{ id: PreviewMode; label: string }> = [
  { id: 'mosaic',  label: 'mosaic'      },
  { id: 'ui',     label: 'ui elements' },
  { id: 'title',  label: 'title design' },
]

const TITLE_LAYOUTS: Array<{ id: TitleLayout; label: string }> = [
  { id: 'hero',      label: 'hero'      },
  { id: 'editorial', label: 'editorial' },
  { id: 'poster',    label: 'poster'    },
]

const ROLES_KEY    = 'color-palette:preview-title-roles'
const TEXT_KEY     = 'color-palette:preview-title-text'
const LAYOUT_KEY   = 'color-palette:preview-title-layout'
const MODE_KEY     = 'color-palette:preview-mode'
const UI_ROLES_KEY = 'color-palette:preview-ui-roles'
const FONT_KEY     = 'color-palette:preview-ui-font'
const RADIUS_KEY   = 'color-palette:preview-ui-radius'

const FONTS = [
  { id: 'system',        label: 'system',         family: 'ui-monospace, monospace',          scale: 1.15, url: null },
  { id: 'inter',         label: 'inter',          family: '"Inter", sans-serif',              scale: 1.15, url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { id: 'playfair',      label: 'playfair',       family: '"Playfair Display", serif',        scale: 1.25, url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap' },
  { id: 'space-grotesk', label: 'space grotesk',  family: '"Space Grotesk", sans-serif',      scale: 1.15, url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
  { id: 'nunito',        label: 'nunito',         family: '"Nunito", sans-serif',             scale: 1.15, url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap' },
  { id: 'jetbrains',     label: 'jetbrains mono', family: '"JetBrains Mono", monospace',      scale: 1.15, url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap' },
] as const

type FontId = typeof FONTS[number]['id']

type RoleIndices = { bg: number; heading: number; accent: number }

function clampRoles(r: RoleIndices, len: number): RoleIndices {
  const c = (n: number) => Math.max(0, Math.min(n, Math.max(0, len - 1)))
  return { bg: c(r.bg), heading: c(r.heading), accent: c(r.accent) }
}

function loadRoles(paletteLen: number): RoleIndices {
  const defaults: RoleIndices = {
    bg:      Math.max(0, paletteLen - 1),
    heading: 0,
    accent:  Math.max(0, Math.floor(paletteLen / 2)),
  }
  try {
    const raw = localStorage.getItem(ROLES_KEY)
    if (raw) return clampRoles(JSON.parse(raw), paletteLen)
  } catch { /* ignore */ }
  return defaults
}

// ---------------------------------------------------------------------------
// Mosaic Mode — color bars
// ---------------------------------------------------------------------------

function MosaicPlaceholder({ palette }: { palette: string[] }) {
  if (palette.length === 0) return null
  return (
    <div className="w-full h-full flex items-stretch">
      {palette.map((hex, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// UI Elements Mode — role editor sidebar + component preview grid
// ---------------------------------------------------------------------------

type UIRoles = {
  background:  number
  foreground:  number
  card:        number
  primary:     number
  accent:      number
  border:      number
  muted:       number
  destructive: number
}

type UIColors = Record<keyof UIRoles, string>

const UI_ROLE_LABELS: (keyof UIRoles)[] = [
  'background', 'foreground', 'card', 'primary', 'accent', 'border', 'muted', 'destructive',
]

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function hexSaturation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return 0
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

function clampUIRoles(r: UIRoles, len: number): UIRoles {
  const c = (n: number) => Math.max(0, Math.min(n, Math.max(0, len - 1)))
  return {
    background: c(r.background), foreground: c(r.foreground), card: c(r.card),
    primary: c(r.primary), accent: c(r.accent), border: c(r.border), muted: c(r.muted),
    destructive: c(r.destructive),
  }
}

function autoAssignUIRoles(palette: string[]): UIRoles {
  if (palette.length === 0) {
    const z = 0
    return { background: z, foreground: z, card: z, primary: z, accent: z, border: z, muted: z, destructive: z }
  }
  const items = palette.map((hex, i) => ({ i, lum: hexLuminance(hex), sat: hexSaturation(hex) }))
  const byLum = [...items].sort((a, b) => b.lum - a.lum)
  const bySat = [...items].sort((a, b) => b.sat - a.sat)
  const n = byLum.length
  return {
    background:  byLum[0].i,
    foreground:  byLum[n - 1].i,
    card:        byLum[Math.min(1, n - 1)].i,
    primary:     bySat[0].i,
    accent:      bySat[Math.min(1, n - 1)].i,
    border:      byLum[Math.floor(n / 2)].i,
    muted:       byLum[Math.max(n - 2, 0)].i,
    destructive: bySat[Math.min(2, n - 1)].i,
  }
}

function loadUIRoles(palette: string[]): UIRoles {
  try {
    const raw = localStorage.getItem(UI_ROLES_KEY)
    if (raw) return clampUIRoles(JSON.parse(raw), palette.length)
  } catch { /* ignore */ }
  return autoAssignUIRoles(palette)
}

function buildThemeVars(colors: UIColors): React.CSSProperties {
  const fgOn = (hex: string) => hexLuminance(hex) > 0.35 ? '#000000' : '#ffffff'
  return {
    '--background':           colors.background,
    '--foreground':           colors.foreground,
    '--card':                 colors.card,
    '--card-foreground':      colors.foreground,
    '--popover':              colors.card,
    '--popover-foreground':   colors.foreground,
    '--primary':              colors.primary,
    '--primary-foreground':   fgOn(colors.primary),
    '--secondary':            colors.card,
    '--secondary-foreground': colors.foreground,
    '--muted':                colors.card,
    '--muted-foreground':     colors.muted,
    '--accent':               colors.accent,
    '--accent-foreground':    fgOn(colors.accent),
    '--border':               colors.border,
    '--input':                colors.border,
    '--ring':                 colors.primary,
    '--destructive':          colors.destructive,
  } as React.CSSProperties
}

const NAV_ITEMS = [
  { label: 'dashboard', Icon: LayoutDashboard },
  { label: 'users',     Icon: Users },
  { label: 'analytics', Icon: BarChart3 },
  { label: 'settings',  Icon: Settings },
]

const STATS = [
  { label: 'total revenue', value: '$15,231', trend: '+20.1%' },
  { label: 'active users',  value: '2,350',   trend: '+8.2%'  },
  { label: 'conversion',    value: '12.5%',   trend: '-2.4%'  },
]

const TABLE_ROWS = [
  { user: 'ken99@example.com', status: 'success', amount: '$316.00', initials: 'KL' },
  { user: 'sarah@acme.com',    status: 'pending', amount: '$242.00', initials: 'SA' },
  { user: 'will@corp.io',      status: 'failed',  amount: '$837.00', initials: 'WC' },
]

const CHART_DATA = [
  { month: 'jan', revenue: 4200 },
  { month: 'feb', revenue: 5800 },
  { month: 'mar', revenue: 4900 },
  { month: 'apr', revenue: 7200 },
  { month: 'may', revenue: 6100 },
  { month: 'jun', revenue: 8900 },
]

const GOALS = [
  { label: 'monthly target',      value: 72 },
  { label: 'user retention',      value: 88 },
  { label: 'support resolution',  value: 54 },
]

function ShadcnDashboard({ colors, fontFamily, fontScale, radius }: {
  colors: UIColors; fontFamily: string; fontScale: number; radius: number
}) {
  const themeVars = buildThemeVars(colors)
  const chartConfig: ChartConfig = {
    revenue: { label: 'Revenue', color: colors.primary },
  }

  return (
    <div
      className="flex-1 overflow-hidden flex"
      style={{ ...themeVars, '--radius': `${radius}rem`, fontFamily, fontSize: `${fontScale * 100}%`, backgroundColor: colors.background } as React.CSSProperties}
    >
      {/* Mini nav sidebar */}
      <div className="w-44 shrink-0 border-r border-border flex flex-col p-3 gap-0.5 bg-card">
        <p className="font-semibold text-sm text-foreground px-3 py-2 mb-1">acme inc</p>
        {NAV_ITEMS.map(({ label, Icon }, i) => (
          <div
            key={label}
            className={[
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm',
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            ].join(' ')}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 space-y-4 bg-background">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">dashboard</h1>
          <Button size="sm">new report</Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {STATS.map(stat => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground lowercase">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <Badge variant="secondary" className="mt-1.5 text-xs">{stat.trend}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mid row — chart + goals */}
        <div className="grid grid-cols-2 gap-4">

          {/* Area chart */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="lowercase text-sm font-medium">revenue trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[110px] w-full">
                <AreaChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: colors.muted, fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="lowercase text-sm font-medium">goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {GOALS.map(goal => (
                <div key={goal.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground lowercase">{goal.label}</span>
                    <span className="text-xs font-medium text-foreground">{goal.value}%</span>
                  </div>
                  <Progress value={goal.value} />
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Bottom row — form + table with avatars */}
        <div className="grid grid-cols-2 gap-4">

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="lowercase">new entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="full name" />
              <Input placeholder="email address" type="email" />
              <Button className="w-full">submit</Button>
            </CardContent>
          </Card>

          {/* Table with avatars */}
          <Card>
            <CardHeader>
              <CardTitle className="lowercase">recent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {TABLE_ROWS.map(row => (
                <div key={row.user} className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{row.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{row.user}</p>
                  </div>
                  <Badge
                    variant={row.status === 'success' ? 'default' : row.status === 'pending' ? 'secondary' : 'destructive'}
                    className="text-xs shrink-0"
                  >
                    {row.status}
                  </Badge>
                  <span className="text-xs text-foreground font-medium shrink-0">{row.amount}</span>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

function UIElementsMode({ palette, roles, colors, onRolesChange }: {
  palette: string[]
  roles: UIRoles
  colors: UIColors
  onRolesChange: (r: UIRoles) => void
}) {
  const [copied, setCopied] = useState(false)
  const [fontId, setFontId] = useState<FontId>(
    () => (localStorage.getItem(FONT_KEY) as FontId | null) ?? 'system'
  )
  const [radius, setRadius] = useState<number>(
    () => parseFloat(localStorage.getItem(RADIUS_KEY) ?? '0.5')
  )
  const [fontReady, setFontReady] = useState(true)

  // Persist font selection
  useEffect(() => {
    localStorage.setItem(FONT_KEY, fontId)
  }, [fontId])

  // Persist radius
  useEffect(() => {
    localStorage.setItem(RADIUS_KEY, String(radius))
  }, [radius])

  // Inject / remove Google Fonts <link>, fade in once loaded
  useEffect(() => {
    const font = FONTS.find(f => f.id === fontId)
    document.getElementById('preview-font-link')?.remove()
    if (font?.url) {
      setFontReady(false)
      const link = document.createElement('link')
      link.id = 'preview-font-link'
      link.rel = 'stylesheet'
      link.href = font.url
      document.head.appendChild(link)
      const familyName = font.family.split(',')[0].replace(/"/g, '').trim()
      document.fonts.load(`400 16px ${familyName}`).then(() => setFontReady(true))
    } else {
      setFontReady(true)
    }
    return () => { document.getElementById('preview-font-link')?.remove() }
  }, [fontId])

  const font = FONTS.find(f => f.id === fontId)
  const fontFamily = font?.family ?? 'inherit'
  const fontScale  = font?.scale  ?? 1

  const copyCSSVars = useCallback(() => {
    const vars = UI_ROLE_LABELS.map(r => `  --${r}: ${palette[roles[r]] ?? '#000'};`).join('\n')
    navigator.clipboard.writeText(`:root {\n${vars}\n}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [palette, roles])

  return (
    <div className="w-full h-full flex">

      {/* Left: role editor + font selector */}
      <div className="w-64 shrink-0 border-r border-border/50 bg-background flex flex-col p-4">

        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">color roles</p>
        <div className="flex flex-col gap-1">
          {UI_ROLE_LABELS.map(role => (
            <RoleSwatchPicker
              key={role}
              label={role}
              palette={palette}
              selectedIndex={roles[role]}
              onSelect={i => onRolesChange({ ...roles, [role]: i })}
              direction="right"
            />
          ))}
        </div>

        <div className="w-full h-px bg-border/50 my-4 shrink-0" />

        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">font</p>
        <div className="flex flex-wrap gap-1">
          {FONTS.map(font => (
            <button
              key={font.id}
              type="button"
              onClick={() => setFontId(font.id)}
              className={[
                'font-mono text-xs px-2 py-1 rounded transition-colors lowercase',
                fontId === font.id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
              ].join(' ')}
            >
              {font.label}
            </button>
          ))}
        </div>

        <div className="w-full h-px bg-border/50 my-4 shrink-0" />

        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">corner radius</p>
        <div className="flex items-center gap-2">
          <input
            type="range" min="0" max="1.5" step="0.05"
            value={radius}
            onChange={e => setRadius(parseFloat(e.target.value))}
            className="min-w-0 flex-1 accent-foreground cursor-pointer"
          />
          <span className="font-mono text-xs text-muted-foreground w-14 text-right shrink-0">
            {radius === 0 ? 'none' : `${radius}rem`}
          </span>
        </div>

        <button
          type="button"
          onClick={copyCSSVars}
          className="mt-auto pt-6 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors lowercase text-left"
        >
          {copied ? 'copied!' : 'copy css vars'}
        </button>
      </div>

      {/* Right: live dashboard */}
      <div className="flex-1 overflow-hidden transition-opacity duration-500" style={{ opacity: fontReady ? 1 : 0 }}>
        <ShadcnDashboard colors={colors} fontFamily={fontFamily} fontScale={fontScale} radius={radius} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editable inline text
// ---------------------------------------------------------------------------

function EditableText({
  value,
  onChange,
  className,
  style,
}: {
  value: string
  onChange: (v: string) => void
  className: string
  style: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false) }}
        onClick={e => e.stopPropagation()}
        className={className + ' bg-transparent border-none outline-none caret-current text-center w-full'}
        style={style}
      />
    )
  }

  return (
    <span
      className={[
        className,
        'cursor-text relative',
        'after:content-["_✎"] after:text-[0.3em] after:opacity-0 after:transition-opacity hover:after:opacity-100',
        'border-b-2 border-dashed border-transparent hover:border-current/60 transition-colors',
      ].join(' ')}
      style={{ ...style, paddingBottom: '0.1em' }}
      onClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      {value}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Palette swatch popover — pick a palette color for a role
// ---------------------------------------------------------------------------

function RoleSwatchPicker({
  label,
  palette,
  selectedIndex,
  onSelect,
  direction = 'up',
}: {
  label: string
  palette: string[]
  selectedIndex: number
  onSelect: (index: number) => void
  direction?: 'up' | 'down' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectedColor = palette[selectedIndex] ?? '#888'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
          open ? 'bg-foreground/10' : 'hover:bg-foreground/5',
        ].join(' ')}
      >
        <span className="font-mono text-xs text-muted-foreground lowercase">{label}</span>
        <span
          className="size-4 rounded-sm border border-border/50 shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
      </button>

      {open && (
        <div className={[
          'absolute bg-popover border border-border rounded-lg p-2 shadow-lg z-50',
          direction === 'right'
            ? 'top-full mt-1 left-0'
            : direction === 'down'
              ? 'top-full mt-1 left-1/2 -translate-x-1/2'
              : 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        ].join(' ')}>
          <div className={['flex gap-1.5', direction === 'right' ? '' : 'flex-wrap max-w-[180px]'].join(' ')}>
            {palette.map((hex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onSelect(i); setOpen(false) }}
                className={[
                  'size-6 rounded transition-all duration-100',
                  i === selectedIndex
                    ? 'ring-2 ring-foreground ring-offset-1 ring-offset-popover scale-110'
                    : 'hover:scale-110',
                ].join(' ')}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Title Design layouts
// ---------------------------------------------------------------------------

type TitleColors = { bg: string; heading: string; accent: string }

type TitleLayoutProps = {
  heading: string; subtitle: string
  onHeadingChange: (v: string) => void; onSubtitleChange: (v: string) => void
  colors: TitleColors
}

function TitleHero({ heading, subtitle, onHeadingChange, onSubtitleChange, colors }: TitleLayoutProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center gap-6 px-20 py-16" style={{ backgroundColor: colors.bg }}>
      <EditableText value={heading} onChange={onHeadingChange}
        className="font-mono text-8xl font-bold tracking-tight leading-none"
        style={{ color: colors.heading }} />
      <EditableText value={subtitle} onChange={onSubtitleChange}
        className="font-mono text-2xl tracking-[0.2em] uppercase"
        style={{ color: colors.accent }} />
      <p className="font-mono text-base leading-relaxed max-w-lg"
        style={{ color: colors.heading, opacity: 0.6 }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
        incididunt ut labore et dolore magna aliqua.
      </p>
      <div>
        <div className="w-16 h-0.5 mb-3" style={{ backgroundColor: colors.accent }} />
        <p className="font-mono text-xs tracking-widest uppercase"
          style={{ color: colors.accent, opacity: 0.7 }}>
          est. mmxxv · color system
        </p>
      </div>
    </div>
  )
}

function TitleEditorial({ heading, subtitle, onHeadingChange, onSubtitleChange, colors }: TitleLayoutProps) {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: colors.bg }}>
      {/* Top nav bar */}
      <div className="shrink-0 flex items-center justify-between px-12 py-3" style={{ borderBottom: `1px solid ${colors.accent}40` }}>
        <span className="font-mono text-sm font-bold tracking-widest uppercase" style={{ color: colors.heading }}>
          color system
        </span>
        <div className="flex items-center gap-8" style={{ color: colors.heading, opacity: 0.45 }}>
          {['archive', 'about', 'subscribe'].map(item => (
            <span key={item} className="font-mono text-xs tracking-wider">{item}</span>
          ))}
        </div>
      </div>

      {/* Article body */}
      <div className="flex-1 overflow-hidden px-16 pt-8 pb-6 flex flex-col gap-4">
        {/* Category tag */}
        <span className="font-mono text-xs tracking-[0.25em] uppercase shrink-0" style={{ color: colors.accent }}>
          color theory
        </span>

        {/* Headline */}
        <EditableText value={heading} onChange={onHeadingChange}
          className="font-mono text-6xl font-bold leading-tight shrink-0"
          style={{ color: colors.heading }} />

        {/* Deck */}
        <EditableText value={subtitle} onChange={onSubtitleChange}
          className="font-mono text-xl leading-relaxed max-w-2xl shrink-0"
          style={{ color: colors.accent }} />

        {/* Byline */}
        <div className="flex items-center gap-3 shrink-0" style={{ color: colors.heading, opacity: 0.45 }}>
          <span className="font-mono text-xs tracking-wider">by lorem ipsum</span>
          <span className="font-mono text-xs">·</span>
          <span className="font-mono text-xs tracking-wider">april 2025</span>
          <span className="font-mono text-xs">·</span>
          <span className="font-mono text-xs tracking-wider">6 min read</span>
        </div>

        {/* Rule */}
        <div className="w-full h-px shrink-0" style={{ backgroundColor: `${colors.accent}30` }} />

        {/* Lede */}
        <p className="font-mono text-base leading-relaxed max-w-3xl shrink-0"
          style={{ color: colors.heading, opacity: 0.85 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip.
        </p>

        {/* Body */}
        <p className="font-mono text-sm leading-relaxed max-w-3xl shrink-0"
          style={{ color: colors.heading, opacity: 0.55 }}>
          Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
          Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Curabitur
          aliquet quam id dui posuere blandit. Nulla porttitor accumsan tincidunt.
        </p>
      </div>
    </div>
  )
}

function TitlePoster({ heading, subtitle, onHeadingChange, onSubtitleChange, colors }: TitleLayoutProps) {
  return (
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* Main display area */}
      <div className="flex-1 flex items-center pl-16 pr-8 overflow-hidden">
        <EditableText value={heading} onChange={onHeadingChange}
          className="font-mono font-black leading-none w-full"
          style={{ color: colors.heading, fontSize: 'clamp(5rem, 18vw, 16rem)' }} />
      </div>
      {/* Bottom accent strip */}
      <div className="shrink-0 flex items-center justify-between px-8 py-5"
        style={{ backgroundColor: colors.accent }}>
        <EditableText value={subtitle} onChange={onSubtitleChange}
          className="font-mono text-xl font-semibold tracking-widest uppercase"
          style={{ color: colors.bg }} />
        <p className="font-mono text-xs tracking-wider" style={{ color: colors.bg, opacity: 0.75 }}>
          lorem ipsum · dolor sit amet · mmxxv
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export default function PalettePreviewOverlay({ palette, onClose }: PalettePreviewOverlayProps) {
  const [mode, setMode] = useState<PreviewMode>(
    () => (localStorage.getItem(MODE_KEY) as PreviewMode | null) ?? 'mosaic'
  )
  const [titleLayout, setTitleLayout] = useState<TitleLayout>(() => {
    const stored = localStorage.getItem(LAYOUT_KEY)
    return (stored === 'hero' || stored === 'editorial' || stored === 'poster') ? stored : 'hero'
  })
  const [heading, setHeading] = useState(
    () => localStorage.getItem(TEXT_KEY + ':heading') ?? 'palette'
  )
  const [subtitle, setSubtitle] = useState(
    () => localStorage.getItem(TEXT_KEY + ':subtitle') ?? 'color system'
  )

  // Title mode role indices
  const [roles, setRoles] = useState<RoleIndices>(() => loadRoles(palette.length))

  // UI elements mode role indices
  const [uiRoles, setUIRoles] = useState<UIRoles>(() => loadUIRoles(palette))

  // Persist whenever roles/text/layout change
  useEffect(() => {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
  }, [roles])

  useEffect(() => {
    localStorage.setItem(UI_ROLES_KEY, JSON.stringify(uiRoles))
  }, [uiRoles])

  useEffect(() => {
    localStorage.setItem(TEXT_KEY + ':heading', heading)
  }, [heading])

  useEffect(() => {
    localStorage.setItem(TEXT_KEY + ':subtitle', subtitle)
  }, [subtitle])

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, titleLayout)
  }, [titleLayout])

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  const setRole = useCallback((key: keyof RoleIndices, index: number) => {
    setRoles(prev => ({ ...prev, [key]: index }))
  }, [])

  const colors: TitleColors = {
    bg:      palette[roles.bg]      ?? '#ffffff',
    heading: palette[roles.heading] ?? '#000000',
    accent:  palette[roles.accent]  ?? '#555555',
  }

  const uiColors: UIColors = {
    background:  palette[uiRoles.background]  ?? '#ffffff',
    foreground:  palette[uiRoles.foreground]  ?? '#000000',
    card:        palette[uiRoles.card]        ?? '#f5f5f5',
    primary:     palette[uiRoles.primary]     ?? '#0066ff',
    accent:      palette[uiRoles.accent]      ?? '#8800ff',
    border:      palette[uiRoles.border]      ?? '#dddddd',
    muted:       palette[uiRoles.muted]       ?? '#888888',
    destructive: palette[uiRoles.destructive] ?? '#ef4444',
  }

  const titleProps = {
    heading, subtitle,
    onHeadingChange: setHeading,
    onSubtitleChange: setSubtitle,
    colors,
  }

  return (
    <motion.div
      className="fixed inset-0 z-[9997] bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >

      {/* Top bar */}
      <div className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="h-12 flex items-center px-4 gap-2">

          {/* View mode switcher */}
          <div className="flex items-center gap-1.5">
            {MODES.map(m => (
              <Button
                key={m.id}
                variant={mode === m.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode(m.id)}
                className="lowercase font-mono"
              >
                {m.label}
              </Button>
            ))}
          </div>

          {/* Title-mode controls */}
          {mode === 'title' && (
            <>
              <div className="w-px h-5 bg-border/50 shrink-0" />

              {/* Layout picker */}
              <div className="flex items-center gap-1.5">
                {TITLE_LAYOUTS.map(l => (
                  <Button
                    key={l.id}
                    variant={titleLayout === l.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTitleLayout(l.id)}
                    className="lowercase font-mono"
                  >
                    {l.label}
                  </Button>
                ))}
              </div>

              <div className="w-px h-5 bg-border/50 shrink-0" />

              {/* Color role pickers */}
              <div className="flex items-center gap-0.5">
                <RoleSwatchPicker label="bg"     palette={palette} selectedIndex={roles.bg}      onSelect={i => setRole('bg', i)}      direction="down" />
                <RoleSwatchPicker label="text"   palette={palette} selectedIndex={roles.heading}  onSelect={i => setRole('heading', i)} direction="down" />
                <RoleSwatchPicker label="accent" palette={palette} selectedIndex={roles.accent}   onSelect={i => setRole('accent', i)} direction="down" />
              </div>
            </>
          )}

          {/* Close — pushed to the right */}
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onClose}
            aria-label="close preview"
            className="ml-auto"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'mosaic'  && <MosaicPlaceholder palette={palette} />}
        {mode === 'ui'      && <UIElementsMode palette={palette} roles={uiRoles} colors={uiColors} onRolesChange={setUIRoles} />}
        {mode === 'title'   && titleLayout === 'hero'      && <TitleHero      {...titleProps} />}
        {mode === 'title'   && titleLayout === 'editorial' && <TitleEditorial {...titleProps} />}
        {mode === 'title'   && titleLayout === 'poster'    && <TitlePoster    {...titleProps} />}
      </div>
    </motion.div>
  )
}
