import { EyeOff, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KEYBOARD_SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

type KeyboardHintsProps = {
  visible: boolean
  onToggle: () => void
  colorCount: number
}

export default function KeyboardHints({ visible, onToggle, colorCount }: KeyboardHintsProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
      <div 
        className={`flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 py-2 bg-card border rounded-lg shadow-lg max-w-2xl transition-all duration-300 ease-out ${
          visible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{ 
          // Firefox fallback: use solid bg if backdrop-filter not supported
          backgroundColor: 'var(--card)',
        }}
      >
        {KEYBOARD_SHORTCUTS.map((shortcut) => {
          const disabled = 'minColors' in shortcut && colorCount < shortcut.minColors
          return (
            <div key={shortcut.key} className={`flex items-center gap-1.5 text-xs transition-opacity duration-200 ${disabled ? 'opacity-30' : ''}`}>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono font-medium border border-border/50 min-w-[20px] text-center">
                {shortcut.key}
              </kbd>
              <span className="text-muted-foreground font-mono">{shortcut.description}</span>
            </div>
          )
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="font-mono text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7"
      >
        {visible ? <EyeOff className="size-3" /> : <Keyboard className="size-3" />}
        <span className="transition-all duration-200">{visible ? 'hide' : 'shortcuts'}</span>
        <kbd className="ml-0.5 px-1 py-0.5 bg-muted rounded text-[10px] font-mono border border-border/50">/</kbd>
      </Button>
    </div>
  )
}
