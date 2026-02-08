import { Undo2, Redo2, FolderOpen, Save, Link, Download, Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PALETTE_PRESETS } from '@/helpers/colorTheory'

type ControlsProps = {
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  onExport: () => void
  onPresetSelect: (presetId: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  canShare: boolean
  canExport: boolean
}

export default function Controls({
  onOpen,
  onSave,
  onShare,
  onExport,
  onPresetSelect,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  canShare,
  canExport,
}: ControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onOpen} className="lowercase font-mono">
              <FolderOpen className="size-4" />
              open
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">open saved palette</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onSave} className="lowercase font-mono">
              <Save className="size-4" />
              save
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">save current palette</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onShare} 
              disabled={!canShare}
              className="lowercase font-mono"
            >
              <Link className="size-4" />
              share
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">copy link to palette</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport} 
              disabled={!canExport}
              className="lowercase font-mono"
            >
              <Download className="size-4" />
              export
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">export palette</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="lowercase font-mono">
                  <Sparkles className="size-4" />
                  presets
                  <ChevronDown className="size-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">generate a preset palette</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="center" className="font-mono lowercase">
            {PALETTE_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => onPresetSelect(preset.id)}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                <span className="text-sm">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="font-mono"
            >
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="font-mono"
            >
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">redo</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
