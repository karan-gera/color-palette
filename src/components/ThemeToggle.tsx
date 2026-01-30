import { useCallback, type MouseEvent } from 'react'
import { Sun, Moon, Circle } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme, type Theme } from '@/hooks/useTheme'
import CircleWipeOverlay from './CircleWipeOverlay'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'light', icon: Sun },
  { value: 'gray', label: 'gray', icon: Circle },
  { value: 'dark', label: 'dark', icon: Moon },
]

export default function ThemeToggle() {
  const { theme, setThemeWithTransition, transition, applyTransitionTarget, completeTransition } = useTheme()

  // Handle click with coordinates for circle wipe animation
  const handleOptionClick = useCallback((e: MouseEvent, value: Theme) => {
    if (value === theme) return // No change needed
    
    // Get click coordinates for animation origin
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    
    setThemeWithTransition(value, origin)
  }, [theme, setThemeWithTransition])

  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={theme}
        // Don't use onValueChange - we handle clicks manually for coordinates
        variant="outline"
        size="sm"
      >
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <ToggleGroupItem 
                  value={option.value} 
                  aria-label={`${option.label} theme`}
                  className={theme === option.value ? 'bg-accent text-accent-foreground' : ''}
                  onClick={(e) => handleOptionClick(e, option.value)}
                >
                  <Icon className="size-4" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs lowercase">{option.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </ToggleGroup>
      
      {/* Circle wipe animation overlay (renders via portal) */}
      <CircleWipeOverlay
        isActive={transition !== null}
        origin={transition?.origin ?? null}
        config={{ 
          theme: transition?.to,
          oldTheme: transition?.from,
        }}
        onApplyState={applyTransitionTarget}
        onAnimationEnd={completeTransition}
      />
    </TooltipProvider>
  )
}
