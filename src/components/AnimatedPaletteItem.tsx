import { useEffect, useState } from 'react'
import PaletteItem from './PaletteItem.tsx'
import styles from './Palette.module.css'

type AnimatedPaletteItemProps = {
  color: string
  index: number
  isLocked: boolean
  onEdit: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
}

export default function AnimatedPaletteItem({ color, isLocked, onEdit, onReroll, onDelete, onToggleLock }: AnimatedPaletteItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDelete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDelete()
    }, 250)
  }

  return (
    <div className={`${styles.cell} ${isVisible ? styles.shown : styles.enter}`}>
      <PaletteItem
        color={color}
        isLocked={isLocked}
        onEdit={onEdit}
        onReroll={onReroll}
        onDelete={handleDelete}
        onToggleLock={onToggleLock}
      />
    </div>
  )
}
