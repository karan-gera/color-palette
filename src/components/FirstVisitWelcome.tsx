import { Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getModifierLabel } from '@/helpers/platform'

type FirstVisitWelcomeProps = {
  open: boolean
  onDismiss: () => void
  onOpenHelp: () => void
}

const WELCOME_COLORS = ['#e06c75', '#e5c07b', '#98c379', '#61afef', '#c678dd']

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-h-6 min-w-7 items-center justify-center rounded-md border border-border bg-muted px-2 py-1 font-mono text-[11px] leading-none text-foreground shadow-[inset_0_-1px_0_var(--border)]">
      {children}
    </kbd>
  )
}

export default function FirstVisitWelcome({ open, onDismiss, onOpenHelp }: FirstVisitWelcomeProps) {
  const helpShortcut = `${getModifierLabel('shift')} /`

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden bg-card p-0 motion-reduce:animate-none motion-reduce:transition-none sm:max-w-[720px]"
      >
        <div className="grid md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-[340px] flex-col justify-center p-7">
            <DialogHeader className="gap-0 text-left">
              <DialogTitle
                className="max-w-[270px] text-[34px] leading-[1.05] tracking-[-0.025em]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                welcome to Palette<em style={{ fontStyle: 'italic', opacity: 0.65 }}>Port</em>.
              </DialogTitle>
              <DialogDescription className="mt-4 font-mono text-xs leading-6">
                use the ? button or <Key>{helpShortcut}</Key> for help. open the shortcuts tray or press <Key>/</Key> to see every command.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onDismiss} className="lowercase">
                start exploring
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onOpenHelp} className="lowercase">
                open help
              </Button>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="relative min-h-[340px] overflow-hidden border-t bg-background/35 md:border-t-0 md:border-l"
            style={{
              backgroundImage: [
                'linear-gradient(to right, color-mix(in oklch, var(--border) 32%, transparent) 1px, transparent 1px)',
                'linear-gradient(to bottom, color-mix(in oklch, var(--border) 32%, transparent) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '24px 24px',
            }}
          >
            <span
              className="absolute top-6 left-6 text-2xl tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Palette<em className="opacity-65">Port</em>
            </span>

            <div className="absolute top-5 right-5 flex flex-col items-end">
              <Key>?</Key>
              <span className="mr-[13px] h-4 border-l border-dashed border-muted-foreground/60" />
              <span className="flex items-center gap-2 text-[10px] text-foreground">
                help <Key>{helpShortcut}</Key>
              </span>
            </div>

            <div className="absolute inset-x-9 top-[104px] flex items-center gap-2">
              {WELCOME_COLORS.map((color) => (
                <span
                  key={color}
                  className="aspect-square flex-1 rounded-full border border-black/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center">
              <span className="text-[10px] text-foreground">all commands</span>
              <span className="h-4 border-l border-dashed border-muted-foreground/60" />
              <span className="flex items-center gap-2.5 whitespace-nowrap text-base text-foreground">
                <Keyboard className="size-6" strokeWidth={1.8} />
                <span>shortcuts</span>
                <Key>/</Key>
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
