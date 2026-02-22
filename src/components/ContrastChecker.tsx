import { useMemo, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  contrastRatio,
  wcagLevel,
  describeContrast,
  THEME_BACKGROUNDS,
  type WCAGLevel,
} from '@/helpers/contrast'

const TAB_VALUES = ['backgrounds', 'each-other'] as const

export type ContrastCheckerHandle = { cycleTab: () => void }

type ContrastCheckerProps = {
  colors: string[]
  expanded: boolean
  onToggle: () => void
}

const ContrastChecker = forwardRef<ContrastCheckerHandle, ContrastCheckerProps>(
function ContrastChecker({ colors, expanded, onToggle }, ref) {
  const [activeTab, setActiveTab] = useState<string>(TAB_VALUES[0])

  const cycleTab = useCallback(() => {
    setActiveTab(prev => {
      const idx = TAB_VALUES.indexOf(prev as typeof TAB_VALUES[number])
      return TAB_VALUES[(idx + 1) % TAB_VALUES.length]
    })
  }, [])

  useImperativeHandle(ref, () => ({ cycleTab }), [cycleTab])

  useEffect(() => {
    if (colors.length < 2) setActiveTab(TAB_VALUES[0])
  }, [colors.length])

  const backgroundResults = useMemo(() => {
    return colors.map((color) => {
      const results = THEME_BACKGROUNDS.map((bg) => {
        const ratio = contrastRatio(color, bg.hex)
        const level = wcagLevel(ratio)
        return { bg: bg.label, hex: bg.hex, ratio, level }
      })
      const description = describeContrast(
        results.map((r) => ({ bg: r.bg, level: r.level }))
      )
      return { color, results, description }
    })
  }, [colors])

  const contrastMatrix = useMemo(() => {
    const matrix: { ratio: number; level: WCAGLevel }[][] = []
    for (let i = 0; i < colors.length; i++) {
      matrix[i] = []
      for (let j = 0; j < colors.length; j++) {
        const ratio = contrastRatio(colors[i], colors[j])
        matrix[i][j] = { ratio, level: wcagLevel(ratio) }
      }
    }
    return matrix
  }, [colors])

  if (colors.length === 0) return null

  return (
    <div className="w-full max-w-6xl flex flex-col items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="font-mono text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7"
      >
        contrast
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </Button>

      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-out ${
          expanded ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 !gap-0">
          <div className={`transition-all duration-200 ease-out overflow-hidden ${
            colors.length >= 2
              ? 'max-h-12 opacity-100'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}>
            <TabsList variant="line" className="mx-auto font-mono text-xs lowercase mb-3">
              <TabsTrigger value="backgrounds" className="font-mono text-xs lowercase">vs backgrounds</TabsTrigger>
              <TabsTrigger value="each-other" className="font-mono text-xs lowercase">vs each other</TabsTrigger>
            </TabsList>
          </div>

          <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
            <TabsContent
              value="backgrounds"
              forceMount
              className="transition-opacity duration-150 ease-out data-[state=inactive]:opacity-0 data-[state=inactive]:pointer-events-none"
            >
              <div className="flex flex-wrap gap-3 justify-center">
                {backgroundResults.map(({ color, results, description }) => (
                  <div
                    key={color}
                    className="bg-card border rounded-lg p-3 w-[170px]"
                  >
                    <p className="font-mono text-xs mb-2 lowercase">{color}</p>
                    <div className="flex flex-col gap-1.5">
                      {results.map((r) => (
                        <div
                          key={r.bg}
                          className="cvd-color flex items-center gap-2 rounded px-2 py-1"
                          style={{ backgroundColor: r.hex }}
                        >
                          <span
                            className="text-base font-medium font-mono"
                            style={{ color }}
                          >
                            Aa
                          </span>
                          <span className="font-mono text-[10px] ml-auto" style={{ color }}>
                            {r.ratio.toFixed(1)}:1
                          </span>
                          <span
                            className={`font-mono text-[10px] ${
                              r.level === 'fail' ? 'text-muted-foreground' : ''
                            }`}
                            style={r.level !== 'fail' ? { color } : undefined}
                          >
                            {r.level}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-muted-foreground font-mono text-[10px] leading-relaxed mt-2">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent
              value="each-other"
              forceMount
              className="transition-opacity duration-150 ease-out data-[state=inactive]:opacity-0 data-[state=inactive]:pointer-events-none"
            >
              {colors.length >= 2 && (
                <div className="flex justify-center">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <td />
                        {colors.map((color, j) => (
                          <td key={j} className="px-2 pb-2 text-center">
                            <span
                              className="cvd-color size-6 rounded-full border border-border/50 inline-block"
                              style={{ backgroundColor: color }}
                            />
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((rowColor, i) => (
                        <tr key={i}>
                          <td className="pr-2 py-1">
                            <span
                              className="cvd-color size-6 rounded-full border border-border/50 inline-block"
                              style={{ backgroundColor: rowColor }}
                            />
                          </td>
                          {colors.map((_, j) => {
                            if (i === j) {
                              return (
                                <td key={j} className="px-2 py-1 text-center">
                                  <span className="font-mono text-xs text-muted-foreground">—</span>
                                </td>
                              )
                            }
                            if (j < i) {
                              return <td key={j} />
                            }
                            const { ratio, level } = contrastMatrix[i][j]
                            return (
                              <td key={j} className="px-2 py-1 text-center">
                                <div className="font-mono text-sm leading-tight">{ratio.toFixed(1)}:1</div>
                                <div
                                  className={`font-mono text-xs leading-tight ${
                                    level === 'fail' ? 'text-muted-foreground' : 'text-foreground'
                                  }`}
                                >
                                  {level}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* explanatory footer */}
        <p className="text-muted-foreground font-mono text-[10px] text-center leading-relaxed">
          wcag contrast — aaa (7:1+) enhanced readability · aa (4.5:1+) minimum for normal text · aa18 (3:1+) minimum for large text (18pt+)
        </p>
      </div>
    </div>
  )
})

export default ContrastChecker
