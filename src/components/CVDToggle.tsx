import { Eye } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCVD, type CVDType, CVD_LABELS } from '@/hooks/useCVD'

const CVD_OPTIONS: { value: CVDType; label: string; shortLabel: string }[] = [
  { value: 'normal', label: CVD_LABELS.normal, shortLabel: '' },
  { value: 'deuteranopia', label: CVD_LABELS.deuteranopia, shortLabel: 'D' },
  { value: 'protanopia', label: CVD_LABELS.protanopia, shortLabel: 'P' },
  { value: 'tritanopia', label: CVD_LABELS.tritanopia, shortLabel: 'T' },
  { value: 'achromatopsia', label: CVD_LABELS.achromatopsia, shortLabel: 'A' },
]

export default function CVDToggle() {
  const { cvd, setCVD } = useCVD()

  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={cvd}
        onValueChange={(value) => {
          if (value) setCVD(value as CVDType)
        }}
        variant="outline"
        size="sm"
      >
        {CVD_OPTIONS.map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value={option.value} 
                aria-label={option.label}
                className={`font-mono text-xs ${cvd === option.value ? 'bg-accent text-accent-foreground' : ''}`}
              >
                {option.value === 'normal' ? (
                  <Eye className="size-4" />
                ) : (
                  <span className="w-4 text-center">{option.shortLabel}</span>
                )}
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">{option.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
    </TooltipProvider>
  )
}
