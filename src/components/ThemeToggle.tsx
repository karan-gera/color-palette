import { Sun, Moon, Circle } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme, type Theme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => {
          if (value) setTheme(value as Theme)
        }}
        variant="outline"
        size="sm"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="light" 
              aria-label="Light theme"
              className={theme === 'light' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Sun className="size-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">light</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="gray" 
              aria-label="Gray theme"
              className={theme === 'gray' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Circle className="size-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">gray</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="dark" 
              aria-label="Dark theme"
              className={theme === 'dark' ? 'bg-accent text-accent-foreground' : ''}
            >
              <Moon className="size-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">dark</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  )
}
