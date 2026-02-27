import { useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateHarmonyScore } from '@/helpers/colorTheory'

type HarmonyScoreProps = {
  colors: string[]
  expanded: boolean
  onToggle: () => void
}

function toBar(value: number, width = 10): string {
  const filled = Math.round((value / 100) * width)
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled)
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-500'
  if (score >= 55) return 'text-yellow-500'
  if (score >= 35) return 'text-orange-500'
  return 'text-red-500'
}

export default function HarmonyScore({ colors, expanded, onToggle }: HarmonyScoreProps) {
  const result = useMemo(() => calculateHarmonyScore(colors), [colors])

  if (colors.length === 0) return null

  return (
    <div className="flex flex-col items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="font-mono text-xs text-muted-foreground hover:text-foreground gap-2 h-7"
      >
        harmony
        {colors.length > 1 && (
          <span className={scoreColor(result.score)}>{result.label}</span>
        )}
        {colors.length > 1 && (
          <span className="text-muted-foreground/50 tabular-nums">{result.score}/100</span>
        )}
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </Button>

      <div
        className={[
          'overflow-hidden transition-all duration-300 ease-out',
          expanded ? 'max-h-32 opacity-100 mt-1' : 'max-h-0 opacity-0',
        ].join(' ')}
      >
        <div className="pb-2 flex flex-col gap-1">
          {colors.length <= 1 ? (
            <p className="font-mono text-xs text-muted-foreground/50 lowercase">
              add more colors to score harmony
            </p>
          ) : (
            <>
              <div className="font-mono text-xs text-muted-foreground/70 lowercase flex items-baseline gap-2">
                <span className="w-[9ch] shrink-0">hue quality</span>
                <span className="tracking-tight">{toBar(result.metrics.hueQuality)}</span>
                <span className="text-muted-foreground/50 tabular-nums w-[3ch] text-right">{result.metrics.hueQuality}</span>
              </div>
              <div className="font-mono text-xs text-muted-foreground/70 lowercase flex items-baseline gap-2">
                <span className="w-[9ch] shrink-0">sat. consist</span>
                <span className="tracking-tight">{toBar(result.metrics.satConsistency)}</span>
                <span className="text-muted-foreground/50 tabular-nums w-[3ch] text-right">{result.metrics.satConsistency}</span>
              </div>
              <div className="font-mono text-xs text-muted-foreground/70 lowercase flex items-baseline gap-2">
                <span className="w-[9ch] shrink-0">lightness</span>
                <span className="tracking-tight">{toBar(result.metrics.lightnessRange)}</span>
                <span className="text-muted-foreground/50 tabular-nums w-[3ch] text-right">{result.metrics.lightnessRange}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
