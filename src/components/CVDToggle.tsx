import { useCallback, type MouseEvent } from 'react'
import { Eye } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCVD, type CVDType, CVD_LABELS, getCVDFilterUrl } from '@/hooks/useCVD'
import CircleWipeOverlay from './CircleWipeOverlay'

const CVD_OPTIONS: { value: CVDType; label: string; shortLabel: string }[] = [
  { value: 'normal', label: CVD_LABELS.normal, shortLabel: '' },
  { value: 'deuteranopia', label: CVD_LABELS.deuteranopia, shortLabel: 'D' },
  { value: 'protanopia', label: CVD_LABELS.protanopia, shortLabel: 'P' },
  { value: 'tritanopia', label: CVD_LABELS.tritanopia, shortLabel: 'T' },
  { value: 'achromatopsia', label: CVD_LABELS.achromatopsia, shortLabel: 'A' },
]

export default function CVDToggle() {
  const { cvd, setCVDWithTransition, transition, applyTransitionTarget, completeTransition } = useCVD()

  // Handle click with coordinates for circle wipe animation
  const handleOptionClick = useCallback((e: MouseEvent, value: CVDType) => {
    if (value === cvd) return // No change needed
    
    // Get click coordinates for animation origin
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    
    setCVDWithTransition(value, origin)
  }, [cvd, setCVDWithTransition])

  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={cvd}
        // Don't use onValueChange - we handle clicks manually for coordinates
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
                onClick={(e) => handleOptionClick(e, option.value)}
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
      
      {/* Horizontal wipe animation overlay for CVD (renders via portal) */}
      <CircleWipeOverlay
        isActive={transition !== null}
        origin={transition?.origin ?? null}
        config={{
          filter: transition ? getCVDFilterUrl(transition.to) : '',
          oldFilter: transition ? getCVDFilterUrl(transition.from) : '',
          animationType: 'horizontal',
        }}
        onApplyState={applyTransitionTarget}
        onAnimationEnd={completeTransition}
        targetElementId="palette-container"
      />
    </TooltipProvider>
  )
}
