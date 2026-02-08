import AnimatedPaletteItem from './AnimatedPaletteItem'
import AddColor from './AddColor'

type AnimatedPaletteContainerProps = {
  colors: string[]
  lockedStates: boolean[]
  onEdit: (index: number) => void
  onReroll: (index: number) => void
  onDelete: (index: number) => void
  onToggleLock: (index: number) => void
  onAdd: () => void
}

export default function AnimatedPaletteContainer({
  colors,
  lockedStates,
  onEdit,
  onReroll,
  onDelete,
  onToggleLock,
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
          onEdit={() => onEdit(index)}
          onReroll={() => onReroll(index)}
          onDelete={() => onDelete(index)}
          onToggleLock={() => onToggleLock(index)}
        />
      ))}
      {showAddButton && <AddColor onAdd={onAdd} />}
    </div>
  )
}
