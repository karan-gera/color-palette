import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PALETTE_PRESETS } from '@/helpers/colorTheory'

type PresetBrowserProps = {
  activePresetId: string | null
  onSelect: (presetId: string) => void
  onReroll: () => void
}

export default function PresetBrowser({ activePresetId, onSelect, onReroll }: PresetBrowserProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const showHover = isHovered && !isDropdownOpen

  const activePreset = activePresetId
    ? PALETTE_PRESETS.find(p => p.id === activePresetId)
    : null

  const currentIndex = activePreset
    ? PALETTE_PRESETS.indexOf(activePreset)
    : -1

  const handlePrev = () => {
    const idx = currentIndex <= 0
      ? PALETTE_PRESETS.length - 1
      : currentIndex - 1
    onSelect(PALETTE_PRESETS[idx].id)
  }

  const handleNext = () => {
    const idx = (currentIndex + 1) % PALETTE_PRESETS.length
    onSelect(PALETTE_PRESETS[idx].id)
  }

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handlePrev}
        className="rounded-r-none border-r-0 font-mono"
      >
        <ChevronLeft className="size-3.5" />
      </Button>

      <div
        className="relative h-8 w-[13ch] flex items-center justify-center border border-border bg-background px-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Label — visible when not hovered */}
        <span
          className={`font-mono text-sm lowercase select-none transition-opacity duration-150 ${
            showHover ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {activePreset?.label ?? 'presets'}
        </span>

        {/* Hover controls — visible when hovered */}
        <div
          className={`absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-150 ${
            showHover ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm hover:bg-accent"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="font-mono lowercase">
              {PALETTE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => { onSelect(preset.id); setIsHovered(false) }}
                  className="flex flex-col items-start gap-0.5 cursor-pointer"
                >
                  <span className="text-sm">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={onReroll}
            disabled={!activePresetId}
            className={`p-1 transition-colors cursor-pointer rounded-sm ${
              activePresetId
                ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleNext}
        className="rounded-l-none border-l-0 font-mono"
      >
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  )
}
