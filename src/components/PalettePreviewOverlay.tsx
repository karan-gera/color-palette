import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

type PreviewMode = 'mosaic' | 'ui' | 'title'
type TitleLayout = 'stacked' | 'side' | 'overlap'

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
  { id: 'stacked', label: 'stacked' },
  { id: 'side',    label: 'side'    },
  { id: 'overlap', label: 'overlap' },
]

const ROLES_KEY   = 'color-palette:preview-title-roles'
const TEXT_KEY    = 'color-palette:preview-title-text'
const LAYOUT_KEY  = 'color-palette:preview-title-layout'
const MODE_KEY    = 'color-palette:preview-mode'

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
// UI Elements placeholder
// ---------------------------------------------------------------------------

function UIPlaceholder({ palette }: { palette: string[] }) {
  const [bg, primary, secondary, accent] = [
    palette[palette.length - 1] ?? '#ffffff',
    palette[0] ?? '#000000',
    palette[1] ?? '#333333',
    palette[2] ?? '#666666',
  ]
  // TODO: replace with component preview grid + color role editor sidebar
  return (
    <div className="w-full h-full flex items-center justify-center p-12" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: secondary }}>
        <div className="h-14 px-5 flex items-center gap-3" style={{ backgroundColor: primary }}>
          <div className="size-2 rounded-full bg-white/40" />
          <div className="h-2 w-24 rounded-full bg-white/40" />
          <div className="ml-auto h-7 w-16 rounded-md bg-white/20" />
        </div>
        <div className="p-5 space-y-3">
          <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: accent, opacity: 0.6 }} />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-5/6 rounded-full bg-white/10" />
          <div className="h-2 w-2/3 rounded-full bg-white/10" />
          <div className="h-9 w-full rounded-lg mt-4" style={{ backgroundColor: primary, opacity: 0.85 }} />
        </div>
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
}: {
  label: string
  palette: string[]
  selectedIndex: number
  onSelect: (index: number) => void
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
        <span className="font-mono text-[10px] text-muted-foreground lowercase">{label}</span>
        <span
          className="size-3.5 rounded-sm border border-border/50 shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg p-2 shadow-lg z-10">
          <div className="flex gap-1.5 flex-wrap max-w-[180px]">
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

function TitleStacked({ heading, subtitle, onHeadingChange, onSubtitleChange, colors }: {
  heading: string; subtitle: string
  onHeadingChange: (v: string) => void; onSubtitleChange: (v: string) => void
  colors: TitleColors
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-12" style={{ backgroundColor: colors.bg }}>
      <EditableText value={heading} onChange={onHeadingChange}
        className="font-mono text-7xl font-bold tracking-tight leading-none text-center"
        style={{ color: colors.heading }} />
      <EditableText value={subtitle} onChange={onSubtitleChange}
        className="font-mono text-2xl tracking-widest text-center"
        style={{ color: colors.accent }} />
    </div>
  )
}

function TitleSide({ heading, subtitle, onHeadingChange, onSubtitleChange, colors }: {
  heading: string; subtitle: string
  onHeadingChange: (v: string) => void; onSubtitleChange: (v: string) => void
  colors: TitleColors
}) {
  return (
    <div className="w-full h-full flex" style={{ backgroundColor: colors.bg }}>
      <div className="flex-1 flex items-center justify-end pr-12 border-r-2" style={{ borderColor: `${colors.accent}40` }}>
        <EditableText value={heading} onChange={onHeadingChange}
          className="font-mono text-7xl font-bold tracking-tight leading-none text-right"
          style={{ color: colors.heading }} />
      </div>
      <div className="flex-1 flex items-center pl-12">
        <EditableText value={subtitle} onChange={onSubtitleChange}
          className="font-mono text-3xl tracking-widest"
          style={{ color: colors.accent }} />
      </div>
    </div>
  )
}

function TitleOverlap({ heading, subtitle, onHeadingChange, onSubtitleChange, colors }: {
  heading: string; subtitle: string
  onHeadingChange: (v: string) => void; onSubtitleChange: (v: string) => void
  colors: TitleColors
}) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: colors.bg }}>
      <div className="absolute inset-0 flex items-center pl-12">
        <EditableText value={heading} onChange={onHeadingChange}
          className="font-mono font-bold leading-none w-full text-left"
          style={{ color: colors.heading, fontSize: 'clamp(5rem, 18vw, 18rem)', opacity: 0.15 }} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <EditableText value={subtitle} onChange={onSubtitleChange}
          className="font-mono tracking-[0.3em] uppercase text-center"
          style={{ color: colors.accent, fontSize: 'clamp(1.25rem, 3vw, 2.5rem)' }} />
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
  const [titleLayout, setTitleLayout] = useState<TitleLayout>(
    () => (localStorage.getItem(LAYOUT_KEY) as TitleLayout | null) ?? 'stacked'
  )
  const [heading, setHeading] = useState(
    () => localStorage.getItem(TEXT_KEY + ':heading') ?? 'palette'
  )
  const [subtitle, setSubtitle] = useState(
    () => localStorage.getItem(TEXT_KEY + ':subtitle') ?? 'color system'
  )

  // Role indices — which palette slot maps to each role; persisted by position
  const [roles, setRoles] = useState<RoleIndices>(() => loadRoles(palette.length))

  // Persist whenever roles/text/layout change
  useEffect(() => {
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles))
  }, [roles])

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

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'mosaic'  && <MosaicPlaceholder palette={palette} />}
        {mode === 'ui'      && <UIPlaceholder     palette={palette} />}
        {mode === 'title'   && titleLayout === 'stacked' && <TitleStacked  {...titleProps} />}
        {mode === 'title'   && titleLayout === 'side'    && <TitleSide     {...titleProps} />}
        {mode === 'title'   && titleLayout === 'overlap' && <TitleOverlap  {...titleProps} />}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="h-14 flex items-center px-6 gap-4">

          {/* View mode switcher */}
          <div className="flex items-center gap-1">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={[
                  'font-mono text-xs px-3 py-1.5 rounded-md transition-colors duration-150 lowercase',
                  mode === m.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Title-mode controls */}
          {mode === 'title' && (
            <>
              <div className="w-px h-5 bg-border/50 shrink-0" />

              {/* Layout — all options visible */}
              <div className="flex items-center gap-1 border border-border/50 rounded-md p-0.5">
                {TITLE_LAYOUTS.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setTitleLayout(l.id)}
                    className={[
                      'font-mono text-xs px-2.5 py-1 rounded transition-colors duration-100 lowercase',
                      titleLayout === l.id
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-border/50 shrink-0" />

              {/* Color role pickers */}
              <div className="flex items-center gap-0.5">
                <RoleSwatchPicker label="bg"     palette={palette} selectedIndex={roles.bg}      onSelect={i => setRole('bg', i)} />
                <RoleSwatchPicker label="text"   palette={palette} selectedIndex={roles.heading}  onSelect={i => setRole('heading', i)} />
                <RoleSwatchPicker label="accent" palette={palette} selectedIndex={roles.accent}   onSelect={i => setRole('accent', i)} />
              </div>
            </>
          )}

          {/* Close — pushed to the right */}
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-foreground/5 ml-auto"
            aria-label="close preview"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
