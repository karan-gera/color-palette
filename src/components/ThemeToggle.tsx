import { useCallback, type KeyboardEvent, type MouseEvent } from 'react'
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

  // Shared transition trigger — derives animation origin from the element's center
  const triggerTransition = useCallback((el: HTMLElement, value: Theme) => {
    if (value === theme) return
    const rect = el.getBoundingClientRect()
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setThemeWithTransition(value, origin)
  }, [theme, setThemeWithTransition])

  const handleOptionClick = useCallback((e: MouseEvent<HTMLElement>, value: Theme) => {
    triggerTransition(e.currentTarget, value)
  }, [triggerTransition])

  const handleOptionKeyDown = useCallback((e: KeyboardEvent<HTMLElement>, value: Theme) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    triggerTransition(e.currentTarget, value)
  }, [triggerTransition])

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
                  onKeyDown={(e) => handleOptionKeyDown(e, option.value)}
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
