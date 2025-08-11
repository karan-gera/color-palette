import { useEffect, useRef, useState } from 'react'
import AnimatedPaletteItem from './AnimatedPaletteItem.tsx'
import AddColor from './AddColor.tsx'
import styles from './Palette.module.css'

type AnimatedPaletteContainerProps = {
  colors: string[]
  lockedStates: boolean[]
  onEdit: (index: number) => void
  onReroll: (index: number) => void
  onDelete: (index: number) => void
  onToggleLock: (index: number) => void
  onAdd: () => void
}

type ItemPosition = {
  id: string
  x: number
  y: number
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Map<string, ItemPosition>>(new Map())
  const [isAnimating, setIsAnimating] = useState(false)

  // Generate stable IDs for each color based on index and value
  const items = colors.map((color, index) => ({
    id: `${index}-${color}`,
    color,
    index,
  }))

  const addButtonId = 'add-button'
  const showAddButton = colors.length < 5

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const children = Array.from(container.children) as HTMLElement[]
    const newPositions = new Map<string, ItemPosition>()

    children.forEach((child) => {
      const rect = child.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const relativeX = rect.left - containerRect.left
      const relativeY = rect.top - containerRect.top

      // Get the ID from data attribute
      const id = child.dataset.itemId
      if (id) {
        newPositions.set(id, {
          id,
          x: relativeX,
          y: relativeY,
        })
      }
    })

    // Check if positions have changed
    const hasChanged = Array.from(newPositions.entries()).some(([id, pos]) => {
      const oldPos = positions.get(id)
      return !oldPos || oldPos.x !== pos.x || oldPos.y !== pos.y
    })

    if (hasChanged && positions.size > 0) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }

    setPositions(newPositions)
  }, [colors.length, positions])

  return (
    <div
      ref={containerRef}
      className={`${styles.row} ${isAnimating ? styles.animating : ''}`}
      style={{
        position: 'relative',
        transition: isAnimating ? 'none' : 'all 0.3s ease',
      }}
    >
      {items.map((item) => {
        const oldPos = positions.get(item.id)
        const shouldAnimate = isAnimating && oldPos

        return (
          <div
            key={item.id}
            data-item-id={item.id}
            style={{
              transform: shouldAnimate ? `translateX(${oldPos.x - (positions.get(item.id)?.x ?? 0)}px)` : 'none',
              transition: shouldAnimate ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
            }}
          >
            <AnimatedPaletteItem
              color={item.color}
              index={item.index}
              isLocked={lockedStates[item.index] ?? false}
              onEdit={() => onEdit(item.index)}
              onReroll={() => onReroll(item.index)}
              onDelete={() => onDelete(item.index)}
              onToggleLock={() => onToggleLock(item.index)}
            />
          </div>
        )
      })}
      {showAddButton && (
        <div
          key={addButtonId}
          data-item-id={addButtonId}
          style={{
            transform: isAnimating && positions.get(addButtonId) 
              ? `translateX(${positions.get(addButtonId)!.x - (positions.get(addButtonId)?.x ?? 0)}px)` 
              : 'none',
            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        >
          <AddColor onAdd={onAdd} />
        </div>
      )}
    </div>
  )
}
