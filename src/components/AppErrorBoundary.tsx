/* eslint-disable react-refresh/only-export-components */
import { Component, useEffect, useRef, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AppErrorBoundaryProps = {
  children: ReactNode
  onReset?: () => void
  onReload?: () => void
}

type AppErrorBoundaryState = {
  hasError: boolean
}

type RecoveryScreenProps = {
  onRetry: () => void
  onReload: () => void
}

function RecoveryScreen({ onRetry, onReload }: RecoveryScreenProps) {
  const alertRef = useRef<HTMLElement>(null)

  useEffect(() => {
    alertRef.current?.focus()
  }, [])

  return (
    <main
      ref={alertRef}
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground"
      role="alert"
      aria-labelledby="recovery-title"
      tabIndex={-1}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-[12%] top-[16%] size-48 rounded-full bg-[radial-gradient(circle_at_35%_30%,oklch(0.84_0.16_25),oklch(0.62_0.2_350)_58%,transparent_72%)] blur-2xl" />
        <div className="absolute bottom-[10%] right-[8%] size-64 rounded-full bg-[radial-gradient(circle_at_55%_45%,oklch(0.84_0.13_75),oklch(0.62_0.18_200)_58%,transparent_72%)] blur-3xl" />
      </div>

      <section className="w-full max-w-xl rounded-2xl border border-border/80 bg-card/90 p-7 shadow-2xl shadow-black/10 backdrop-blur-sm sm:p-10">
        <div className="mb-8 flex items-center gap-3" aria-hidden="true">
          {['#e06c75', '#e5c07b', '#98c379', '#61afef', '#c678dd'].map((color) => (
            <span key={color} className="size-7 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }} />
          ))}
          <span className="ml-auto font-mono text-[10px] tracking-[0.28em] text-muted-foreground">paletteport</span>
        </div>

        <div className="flex items-start gap-4">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">workspace interrupted</p>
            <h1 id="recovery-title" className="font-mono text-3xl tracking-tight sm:text-4xl">something went wrong</h1>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              paletteport could not render the workspace. your saved palettes stay in this browser; nothing was cleared from this screen.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={onRetry} className="lowercase">
            <RotateCcw aria-hidden="true" />
            try again
          </Button>
          <Button type="button" variant="outline" onClick={onReload} className="lowercase">
            reload app
          </Button>
        </div>

        <details className="mt-8 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none text-foreground underline decoration-border underline-offset-4">recovery notes</summary>
          <div className="mt-3 space-y-2 leading-relaxed">
            <p>try again keeps the current page and local data intact. reload starts a fresh app session.</p>
            <p>if the problem returns after a reload, back up any palettes you can reach, then use your browser’s site-data controls as a last resort. clearing site data is manual and permanently removes local palettes.</p>
          </div>
        </details>
      </section>
    </main>
  )
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[app] render error', error, errorInfo)
  }

  private handleRetry = () => {
    this.props.onReset?.()
    this.setState({ hasError: false })
  }

  private handleReload = () => {
    if (this.props.onReload) {
      this.props.onReload()
      return
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return <RecoveryScreen onRetry={this.handleRetry} onReload={this.handleReload} />
    }

    return this.props.children
  }
}
