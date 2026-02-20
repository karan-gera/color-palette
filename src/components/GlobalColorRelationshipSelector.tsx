import { ChevronDown, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { COLOR_RELATIONSHIPS, type ColorRelationship } from '@/helpers/colorTheory'

type GlobalColorRelationshipSelectorProps = {
  currentRelationship: ColorRelationship
  onRelationshipChange: (relationship: ColorRelationship) => void
  onGlobalReroll: () => void
}

export default function GlobalColorRelationshipSelector({ 
  currentRelationship, 
  onRelationshipChange,
  onGlobalReroll
}: GlobalColorRelationshipSelectorProps) {
  const currentLabel = COLOR_RELATIONSHIPS.find(r => r.value === currentRelationship)?.label || 'Random'

  return (
    <TooltipProvider>
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="flex items-center gap-2 mt-4"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onGlobalReroll}
              className="font-mono lowercase font-semibold"
            >
              <RefreshCw className="size-4" />
              reroll all
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">regenerate all unlocked colors</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono lowercase min-w-[160px] justify-between"
                >
                  {currentLabel.toLowerCase()}
                  <ChevronDown className="size-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">color relationship mode</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="center" className="min-w-[200px]">
            <DropdownMenuRadioGroup
              value={currentRelationship}
              onValueChange={(value) => onRelationshipChange(value as ColorRelationship)}
            >
              {COLOR_RELATIONSHIPS.map((rel) => (
                <DropdownMenuRadioItem
                  key={rel.value}
                  value={rel.value}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                >
                  <span className="font-mono text-sm font-medium">{rel.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{rel.description}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </TooltipProvider>
  )
}
