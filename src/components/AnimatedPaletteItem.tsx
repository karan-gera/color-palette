import { useEffect, useRef, useState } from 'react'
import PaletteItem from './PaletteItem'

type AnimatedPaletteItemProps = {
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

export default function AnimatedPaletteItem({ color, isLocked, isEditing, isDragging, dragActive, itemStyle, setRef, onDragPointerDown, onDragPointerMove, onDragPointerUp, onEditStart, onEditSave, onEditCancel, onReroll, onDelete, onToggleLock, onViewVariations }: AnimatedPaletteItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const [isDeleting, setIsDeleting] = useState(false)
  const onDeleteRef = useRef(onDelete)
  onDeleteRef.current = onDelete

  const handleDelete = () => {
    if (isDeleting) return // Already deleting - ignore click
    setIsDeleting(true)
    setIsVisible(false)
    setTimeout(() => {
      onDeleteRef.current()
    }, 250)
  }

  return (
    <div
      ref={setRef}
      style={isDragging ? undefined : itemStyle}
      className={`flex flex-col items-center ${
        isDragging
          ? 'z-50'
          : dragActive
            ? 'transition-transform duration-200 ease-out'
            : 'transition-all duration-250 ease-out'
      } ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
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
          onDelete={handleDelete}
          onToggleLock={onToggleLock}
          onViewVariations={onViewVariations}
        />
      </div>
    </div>
  )
}
