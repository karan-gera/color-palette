import { Undo2, Redo2, FolderOpen, Save, Link, Download, Pipette, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import PresetBrowser from './PresetBrowser'
import { hasEyeDropper } from '@/helpers/eyeDropper'
import { isMac } from '@/helpers/platform'

const showPickButton = hasEyeDropper || isMac

type ControlsProps = {
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  onExport: () => void
  onPresetSelect: (presetId: string) => void
  onPresetReroll: () => void
  activePresetId: string | null
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  canShare: boolean
  canExport: boolean
  onPickColor: () => void
  canPickColor: boolean
  onToggleSwapMode: () => void
  swapMode: boolean
  canSwap: boolean
}

export default function Controls({
  onOpen,
  onSave,
  onShare,
  onExport,
  onPresetSelect,
  onPresetReroll,
  activePresetId,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  canShare,
  canExport,
  onPickColor,
  canPickColor,
  onToggleSwapMode,
  swapMode,
  canSwap,
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

        {showPickButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onPickColor}
                disabled={!canPickColor}
                className="lowercase font-mono"
              >
                <Pipette className="size-4" />
                pick
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs lowercase">pick color from screen</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={swapMode ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleSwapMode}
              disabled={!canSwap}
              className="lowercase font-mono"
            >
              <ArrowLeftRight className="size-4" />
              rearrange
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono text-xs lowercase">rearrange colors</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <PresetBrowser
          activePresetId={activePresetId}
          onSelect={onPresetSelect}
          onReroll={onPresetReroll}
        />

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
