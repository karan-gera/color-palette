import { useMemo, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { generateTints, generateShades, generateTones } from '@/helpers/colorTheory'
import { getColorName } from '@/helpers/colorNaming'

type ColorVariationsProps = {
  sourceColor: string
  sourceIndex: number
  onClose: () => void
  onCopyHex: (hex: string) => void
  onReplaceColor: (index: number, newHex: string) => void
}

type VariationSwatchProps = {
  color: string
  isSource?: boolean
  delay: number
  onClick: (e: React.MouseEvent) => void
}

function VariationSwatch({ color, isSource, delay, onClick }: VariationSwatchProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const textColor = useMemo(() => {
    const bg = color.replace('#', '')
    const r = parseInt(bg.substring(0, 2), 16)
    const g = parseInt(bg.substring(2, 4), 16)
    const b = parseInt(bg.substring(4, 6), 16)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 160 ? '#111111' : '#ffffff'
  }, [color])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`cvd-color size-10 rounded-lg border transition-all duration-300 cursor-pointer hover:scale-110 hover:border-foreground ${
            isSource ? 'border-2 border-foreground ring-2 ring-foreground/20' : 'border-border/50'
          } ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{
            backgroundColor: color,
            color: textColor,
          }}
          onClick={onClick}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-mono text-xs lowercase">{color}</p>
        <p className="font-mono text-[10px] text-muted-foreground lowercase">click replace · shift+click copy</p>
      </TooltipContent>
    </Tooltip>
  )
}

type VariationRowProps = {
  label: string
  sourceColor: string
  variations: string[]
  baseDelay: number
  onSwatchClick: (hex: string, e: React.MouseEvent) => void
}

function VariationRow({ label, sourceColor, variations, baseDelay, onSwatchClick }: VariationRowProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs text-muted-foreground lowercase">{label}</span>
      <div className="flex gap-2 flex-wrap">
        <VariationSwatch
          color={sourceColor}
          isSource
          delay={baseDelay}
          onClick={(e) => onSwatchClick(sourceColor, e)}
        />
        {variations.map((hex, i) => (
          <VariationSwatch
            key={hex + i}
            color={hex}
            delay={baseDelay + (i + 1) * 30}
            onClick={(e) => onSwatchClick(hex, e)}
          />
        ))}
      </div>
    </div>
  )
}

export default function ColorVariations({
  sourceColor,
  sourceIndex,
  onClose,
  onCopyHex,
  onReplaceColor,
}: ColorVariationsProps) {
  const tints = useMemo(() => generateTints(sourceColor), [sourceColor])
  const shades = useMemo(() => generateShades(sourceColor), [sourceColor])
  const tones = useMemo(() => generateTones(sourceColor), [sourceColor])
  const colorName = useMemo(() => getColorName(sourceColor), [sourceColor])

  const handleSwatchClick = (hex: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      onCopyHex(hex)
    } else {
      onReplaceColor(sourceIndex, hex)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-5 items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="font-mono text-xs lowercase gap-1.5">
            <ArrowLeft className="size-3.5" />
            back
          </Button>
          <div
            className="cvd-color size-5 rounded-full border border-border/50"
            style={{ backgroundColor: sourceColor }}
          />
          <span className="font-mono text-sm lowercase">
            variations of {colorName.name} {sourceColor}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <VariationRow
            label="tints"
            sourceColor={sourceColor}
            variations={tints}
            baseDelay={0}
            onSwatchClick={handleSwatchClick}
          />
          <VariationRow
            label="shades"
            sourceColor={sourceColor}
            variations={shades}
            baseDelay={100}
            onSwatchClick={handleSwatchClick}
          />
          <VariationRow
            label="tones"
            sourceColor={sourceColor}
            variations={tones}
            baseDelay={200}
            onSwatchClick={handleSwatchClick}
          />
        </div>

        <span className="font-mono text-[10px] text-muted-foreground lowercase">
          click to replace · shift+click to copy · esc to return
        </span>
      </div>
    </TooltipProvider>
  )
}
