import { motion } from 'framer-motion'
import PaletteItem from './PaletteItem'
import { BLUEPRINT_COLOR } from '@/helpers/colorTheory'

type AnimatedPaletteItemProps = {
  layoutId: string
  color: string
  index: number
  isLocked: boolean
  isEditing: boolean
  onEditStart: () => void
  onEditSave: (hex: string) => void
  onEditCancel: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
  onViewVariations: () => void
  swapMode: boolean
  isSwapSelected: boolean
  onSwapClick: () => void
}

export default function AnimatedPaletteItem({
  layoutId,
  color,
  index,
  isLocked,
  isEditing,
  onEditStart,
  onEditSave,
  onEditCancel,
  onReroll,
  onDelete,
  onToggleLock,
  onViewVariations,
  swapMode,
  isSwapSelected,
  onSwapClick,
}: AnimatedPaletteItemProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: isSwapSelected ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 32 },
        opacity: { duration: 0.15, ease: 'easeOut' },
        scale: { duration: 0.15, ease: 'easeOut' },
      }}
      className="relative flex flex-col items-center"
    >
      {swapMode && (
        <div
          className="absolute -top-2 -right-2 z-10 size-7 rounded-full flex items-center justify-center font-mono text-xs font-bold select-none"
          style={{
            backgroundColor: BLUEPRINT_COLOR,
            color: 'white',
          }}
        >
          {index + 1}
        </div>
      )}

      {isSwapSelected && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 0 3px ${BLUEPRINT_COLOR}`,
            top: 0,
            width: 'var(--circle-size)',
            height: 'var(--circle-size)',
          }}
        />
      )}

      <PaletteItem
        color={color}
        isLocked={isLocked}
        isEditing={isEditing}
        onEditStart={onEditStart}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
        onReroll={onReroll}
        onDelete={onDelete}
        onToggleLock={onToggleLock}
        onViewVariations={onViewVariations}
        swapMode={swapMode}
        isSwapSelected={isSwapSelected}
        onSwapClick={onSwapClick}
      />
    </motion.div>
  )
}
