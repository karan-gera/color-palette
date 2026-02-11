import { useCallback } from 'react'
import AnimatedPaletteItem from './AnimatedPaletteItem'
import AddColor from './AddColor'
import { usePaletteDrag } from '@/hooks/usePaletteDrag'

type AnimatedPaletteContainerProps = {
  colors: string[]
  lockedStates: boolean[]
  editIndex: number | null
  onEditStart: (index: number) => void
  onEditSave: (index: number, hex: string) => void
  onEditCancel: () => void
  onReroll: (index: number) => void
  onDelete: (index: number) => void
  onToggleLock: (index: number) => void
  onViewVariations: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onAdd: () => void
}

export default function AnimatedPaletteContainer({
  colors,
  lockedStates,
  editIndex,
  onEditStart,
  onEditSave,
  onEditCancel,
  onReroll,
  onDelete,
  onToggleLock,
  onViewVariations,
  onReorder,
  onAdd,
}: AnimatedPaletteContainerProps) {
  const showAddButton = colors.length < 5

  const {
    dragState,
    setItemRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getItemStyle,
    isDragging,
  } = usePaletteDrag(colors.length, onReorder, editIndex !== null)

  const handleToggleLock = useCallback((index: number) => {
    // Suppress click-to-lock when drag just finished
    if (isDragging) return
    onToggleLock(index)
  }, [isDragging, onToggleLock])

  return (
    <div id="palette-container" className="flex flex-wrap gap-5 items-start justify-center">
      {colors.map((color, index) => (
        <AnimatedPaletteItem
          key={`${index}-${color}`}
          color={color}
          index={index}
          isLocked={lockedStates[index] ?? false}
          isEditing={editIndex === index}
          isDragging={dragState?.dragIndex === index}
          dragActive={isDragging}
          itemStyle={getItemStyle(index)}
          setRef={(el) => setItemRef(index, el)}
          onDragPointerDown={(e) => onPointerDown(index, e)}
          onDragPointerMove={onPointerMove}
          onDragPointerUp={onPointerUp}
          onEditStart={() => onEditStart(index)}
          onEditSave={(hex) => onEditSave(index, hex)}
          onEditCancel={onEditCancel}
          onReroll={() => onReroll(index)}
          onDelete={() => onDelete(index)}
          onToggleLock={() => handleToggleLock(index)}
          onViewVariations={() => onViewVariations(index)}
        />
      ))}
      {showAddButton && <AddColor onAdd={onAdd} />}
    </div>
  )
}
