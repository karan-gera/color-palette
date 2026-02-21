import { EyeOff, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SHORTCUT_GROUPS, type ShortcutDef, type ShortcutGroup } from '@/hooks/useKeyboardShortcuts'
import { getModifierLabel, isMac } from '@/helpers/platform'

type KeyboardHintsProps = {
  visible: boolean
  onToggle: () => void
  colorCount: number
}

function ShortcutRow({ shortcut, colorCount }: { shortcut: ShortcutDef; colorCount: number }) {
  const disabled = shortcut.minColors !== undefined && colorCount < shortcut.minColors

  return (
    <div className={`flex items-center gap-1.5 text-xs transition-opacity duration-200 ${disabled ? 'opacity-30' : ''}`}>
      <span className="flex items-center gap-0.5 shrink-0">
        {shortcut.modifiers?.map((mod) => (
          <kbd
            key={mod}
            className={`px-1 bg-muted rounded font-mono font-medium border border-border/50 min-w-[18px] text-center ${
              isMac ? 'text-sm leading-[18px]' : 'text-[10px] py-0.5'
            }`}
          >
            {getModifierLabel(mod)}
          </kbd>
        ))}
        {shortcut.key.split(' ').map((part, i) => (
          <kbd key={i} className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono font-medium border border-border/50 min-w-[18px] text-center">
            {part}
          </kbd>
        ))}
      </span>
      <span className="text-muted-foreground font-mono whitespace-nowrap">{shortcut.description}</span>
    </div>
  )
}

function ShortcutGroupSection({ group, colorCount }: { group: ShortcutGroup; colorCount: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-wider mb-0.5">
        {group.label}
      </h3>
      {group.shortcuts.map((shortcut) => (
        <ShortcutRow
          key={`${(shortcut.modifiers ?? []).join('-')}-${shortcut.key}`}
          shortcut={shortcut}
          colorCount={colorCount}
        />
      ))}
    </div>
  )
}

export default function KeyboardHints({ visible, onToggle, colorCount }: KeyboardHintsProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
      <div
        className={`flex gap-5 px-4 py-3 bg-card border rounded-lg shadow-lg transition-all duration-300 ease-out overflow-y-auto max-h-[calc(100vh-8rem)] pointer-events-auto ${
          visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--card)' }}
      >
        {SHORTCUT_GROUPS.map((group) => (
          <ShortcutGroupSection key={group.label} group={group} colorCount={colorCount} />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="font-mono text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7 pointer-events-auto"
      >
        {visible ? <EyeOff className="size-3" /> : <Keyboard className="size-3" />}
        <span className="transition-all duration-200">{visible ? 'hide' : 'shortcuts'}</span>
        <kbd className="ml-0.5 px-1 py-0.5 bg-muted rounded text-[10px] font-mono border border-border/50">/</kbd>
      </Button>
    </div>
  )
}
