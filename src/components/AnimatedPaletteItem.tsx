import { useEffect, useRef, useState } from 'react'
import PaletteItem from './PaletteItem'

type AnimatedPaletteItemProps = {
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
}

export default function AnimatedPaletteItem({ color, isLocked, isEditing, onEditStart, onEditSave, onEditCancel, onReroll, onDelete, onToggleLock, onViewVariations }: AnimatedPaletteItemProps) {
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
      className={`flex flex-col items-center transition-all duration-250 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
      }`}
    >
      <PaletteItem
        color={color}
        isLocked={isLocked}
        isEditing={isEditing}
        onEditStart={onEditStart}
        onEditSave={onEditSave}
        onEditCancel={onEditCancel}
        onReroll={onReroll}
        onDelete={handleDelete}
        onToggleLock={onToggleLock}
        onViewVariations={onViewVariations}
      />
    </div>
  )
}
