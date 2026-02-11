import { useEffect, useMemo, useRef, useState } from 'react'
import { Blend, Check, Pencil, Pipette, RefreshCw, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import LockIcon from './LockIcon'
import ColorFormatMenu from './ColorFormatMenu'
import HslPicker from './HslPicker'
import { getColorName } from '@/helpers/colorNaming'
import { hasEyeDropper, pickColorNative } from '@/helpers/eyeDropper'

function hexLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

type PaletteItemProps = {
  color: string
  isLocked: boolean
  isEditing: boolean
  isDragging?: boolean
  onDragPointerDown?: (e: React.PointerEvent) => void
  onEditStart: () => void
  onEditSave: (newHex: string) => void
  onEditCancel: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
  onViewVariations: () => void
}

export default function PaletteItem({ color, isLocked, isEditing, isDragging, onDragPointerDown, onEditStart, onEditSave, onEditCancel, onReroll, onDelete, onToggleLock, onViewVariations }: PaletteItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editInvalid, setEditInvalid] = useState(false)
  const [showHslPicker, setShowHslPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fillChar = useMemo(() => hexLuminance(color) > 128 ? 'f' : '0', [color])
  const previewColor = isEditing ? '#' + editValue.padEnd(6, fillChar) : color

  useEffect(() => {
    setShowHslPicker(false)
    if (isEditing) {
      setEditValue(color.replace('#', ''))
      setEditInvalid(false)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isEditing, color])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    setEditValue(v)
  }

  const handleConfirm = () => {
    if (editValue.length === 6) {
      onEditSave('#' + editValue.toLowerCase())
    } else {
      setEditInvalid(true)
      setTimeout(() => setEditInvalid(false), 600)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onEditCancel()
    }
  }

  const textColor = useMemo(() => hexLuminance(previewColor) > 160 ? '#111111' : '#ffffff', [previewColor])

  const colorName = useMemo(() => getColorName(color), [color])

  const showLockIcon = isLocked || isHovered

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          className={`size-[200px] rounded-full border-2 border-dashed flex items-center justify-center relative ${isEditing ? '' : 'transition-all duration-500 ease-in-out'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            backgroundColor: previewColor,
            borderColor: textColor,
            color: textColor,
            touchAction: 'none',
          }}
          aria-label={`${isLocked ? 'Unlock' : 'Lock'} color ${color}`}
          onClick={onToggleLock}
          onPointerDown={onDragPointerDown}
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
              <Button variant="ghost" size="icon-xs" onClick={onEditStart}>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={onViewVariations}>
                <Blend className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">variations</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <span
          className="font-mono text-xs text-muted-foreground lowercase truncate max-w-[180px] text-center"
          title={colorName.name}
        >
          {colorName.name}
        </span>

        <div className="relative flex items-center justify-center">
          {isEditing && (
            <div className="absolute right-full mr-1.5 flex items-center gap-1">
              {hasEyeDropper && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                  onClick={async () => {
                    const hex = await pickColorNative()
                    if (hex) setEditValue(hex.replace('#', ''))
                  }}
                  className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  <Pipette className="size-3" />
                </button>
              )}
              <Popover open={showHslPicker} onOpenChange={setShowHslPicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
                    className="font-mono text-base leading-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    •
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  className="w-52 p-3"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <HslPicker
                    hex={editValue.padEnd(6, fillChar)}
                    fillChar={fillChar}
                    onChange={setEditValue}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className={`flex items-center border-b transition-colors duration-200 ${
            isEditing
              ? (editInvalid ? 'border-red-500' : 'border-foreground')
              : 'border-transparent'
          }`}>
            {isEditing ? (
              <>
                <span className="font-mono text-xs text-muted-foreground">#</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={editValue}
                  onChange={handleEditChange}
                  onKeyDown={handleEditKeyDown}
                  onBlur={() => {
                    requestAnimationFrame(() => {
                      if (document.activeElement?.closest('[data-slot="popover-content"]')) return
                      onEditCancel()
                    })
                  }}
                  className="font-mono text-xs text-muted-foreground uppercase bg-transparent outline-none w-[6ch] p-0 border-0"
                  maxLength={6}
                />
              </>
            ) : (
              <ColorFormatMenu color={color} />
            )}
          </div>

          {isEditing && (
            <div className="absolute left-full ml-1.5 flex items-center gap-0.5">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onEditCancel}
                className="text-muted-foreground hover:text-destructive transition-colors p-0.5 cursor-pointer"
              >
                <X className="size-3" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleConfirm}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
              >
                <Check className="size-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
