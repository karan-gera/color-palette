import { Undo2, Redo2, FolderOpen, Save, Link, Download, Pipette, ArrowLeftRight } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import PresetBrowser from './PresetBrowser'
import { hasEyeDropper } from '@/helpers/eyeDropper'
import { isMac } from '@/helpers/platform'

const showPickButton = hasEyeDropper || isMac

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: -5 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
}

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
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2 flex-wrap justify-center"
      >
        {/* File ops */}
        <motion.div variants={item} className="flex items-center gap-2">
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
        </motion.div>

        {/* Color ops */}
        <motion.div variants={item} className="flex items-center gap-2">
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
        </motion.div>

        <motion.div variants={item} className="w-px h-6 bg-border mx-1" />

        <motion.div variants={item}>
          <PresetBrowser
            activePresetId={activePresetId}
            onSelect={onPresetSelect}
            onReroll={onPresetReroll}
          />
        </motion.div>

        <motion.div variants={item} className="w-px h-6 bg-border mx-1" />

        {/* Undo / redo */}
        <motion.div variants={item} className="flex items-center gap-2">
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
        </motion.div>
      </motion.div>
    </TooltipProvider>
  )
}
