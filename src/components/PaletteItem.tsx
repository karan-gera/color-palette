import { useMemo, useState } from 'react'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import LockIcon from './LockIcon'
import ColorFormatMenu from './ColorFormatMenu'
import { getColorName } from '@/helpers/colorNaming'

type PaletteItemProps = {
  color: string
  isLocked: boolean
  onEdit: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
}

export default function PaletteItem({ color, isLocked, onEdit, onReroll, onDelete, onToggleLock }: PaletteItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const textColor = useMemo(() => {
    const bg = (color ?? '#ffffff').replace('#', '')
    const r = parseInt(bg.substring(0, 2), 16)
    const g = parseInt(bg.substring(2, 4), 16)
    const b = parseInt(bg.substring(4, 6), 16)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 160 ? '#111111' : '#ffffff'
  }, [color])

  const colorName = useMemo(() => getColorName(color), [color])

  const showLockIcon = isLocked || isHovered

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className="size-[200px] rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out relative"
          style={{
            backgroundColor: color,
            borderColor: textColor,
            color: textColor,
          }}
          aria-label={`${isLocked ? 'Unlock' : 'Lock'} color ${color}`}
          onClick={onToggleLock}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {showLockIcon && (
            <div 
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
              style={{ opacity: isLocked ? 1 : 0.7 }}
            >
              <LockIcon isLocked={isLocked} size={32} color={textColor} />
            </div>
          )}
        </button>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onEdit}>
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">edit</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onReroll}
                disabled={isLocked}
                className={isLocked ? 'opacity-40' : ''}
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">reroll</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">delete</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {colorName.cssName ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="font-mono text-xs text-muted-foreground lowercase truncate max-w-[180px] text-center cursor-default"
                title={colorName.name}
              >
                {colorName.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">css: {colorName.cssName}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span
            className="font-mono text-xs text-muted-foreground lowercase truncate max-w-[180px] text-center"
            title={colorName.name}
          >
            {colorName.name}
          </span>
        )}

        <ColorFormatMenu color={color} />
      </div>
    </TooltipProvider>
  )
}
