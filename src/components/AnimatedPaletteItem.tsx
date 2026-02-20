import { motion } from 'framer-motion'
import PaletteItem from './PaletteItem'

type AnimatedPaletteItemProps = {
  layoutId: string
  color: string
  index: number
  isLocked: boolean
  isEditing: boolean
  isDragging: boolean
  dragActive: boolean
  itemStyle: React.CSSProperties
  setRef: (el: HTMLDivElement | null) => void
  onDragPointerDown: (e: React.PointerEvent) => void
  onDragPointerMove: (e: React.PointerEvent) => void
  onDragPointerUp: (e: React.PointerEvent) => void
  onEditStart: () => void
  onEditSave: (hex: string) => void
  onEditCancel: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
  onViewVariations: () => void
}

export default function AnimatedPaletteItem({
  layoutId,
  color,
  isLocked,
  isEditing,
  isDragging,
  dragActive,
  itemStyle,
  setRef,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerUp,
  onEditStart,
  onEditSave,
  onEditCancel,
  onReroll,
  onDelete,
  onToggleLock,
  onViewVariations,
}: AnimatedPaletteItemProps) {
  return (
    <motion.div
      layoutId={layoutId}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        layout: { type: 'spring', stiffness: 400, damping: 32 },
        opacity: { duration: 0.15, ease: 'easeOut' },
        scale: { duration: 0.15, ease: 'easeOut' },
      }}
      ref={setRef}
      style={isDragging ? undefined : itemStyle}
      className={`flex flex-col items-center ${
        isDragging
          ? 'z-50'
          : dragActive
            ? 'transition-transform duration-200 ease-out'
            : ''
      }`}
    >
      <div
        style={isDragging ? itemStyle : undefined}
        className={isDragging ? 'cursor-grabbing' : ''}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
      >
        <PaletteItem
          color={color}
          isLocked={isLocked}
          isEditing={isEditing}
          isDragging={isDragging}
          onDragPointerDown={onDragPointerDown}
          onEditStart={onEditStart}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
          onReroll={onReroll}
          onDelete={onDelete}
          onToggleLock={onToggleLock}
          onViewVariations={onViewVariations}
        />
      </div>
    </motion.div>
  )
}
