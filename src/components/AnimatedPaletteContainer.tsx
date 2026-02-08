import AnimatedPaletteItem from './AnimatedPaletteItem'
import AddColor from './AddColor'

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
  onAdd,
}: AnimatedPaletteContainerProps) {
  const showAddButton = colors.length < 5

  return (
    <div id="palette-container" className="flex flex-wrap gap-5 items-start justify-center">
      {colors.map((color, index) => (
        <AnimatedPaletteItem
          key={`${index}-${color}`}
          color={color}
          index={index}
          isLocked={lockedStates[index] ?? false}
          isEditing={editIndex === index}
          onEditStart={() => onEditStart(index)}
          onEditSave={(hex) => onEditSave(index, hex)}
          onEditCancel={onEditCancel}
          onReroll={() => onReroll(index)}
          onDelete={() => onDelete(index)}
          onToggleLock={() => onToggleLock(index)}
          onViewVariations={() => onViewVariations(index)}
        />
      ))}
      {showAddButton && <AddColor onAdd={onAdd} />}
    </div>
  )
}
