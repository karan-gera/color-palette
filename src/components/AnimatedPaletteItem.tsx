import { useEffect, useState } from 'react'
import PaletteItem from './PaletteItem'

type AnimatedPaletteItemProps = {
  color: string
  index: number
  isLocked: boolean
  onEdit: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
  onViewVariations: () => void
}

export default function AnimatedPaletteItem({ color, isLocked, onEdit, onReroll, onDelete, onToggleLock, onViewVariations }: AnimatedPaletteItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    if (isDeleting) return // Already deleting - ignore click
    setIsDeleting(true)
    setIsVisible(false)
    setTimeout(() => {
      onDelete()
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
        onEdit={onEdit}
        onReroll={onReroll}
        onDelete={handleDelete}
        onToggleLock={onToggleLock}
        onViewVariations={onViewVariations}
      />
    </div>
  )
}
