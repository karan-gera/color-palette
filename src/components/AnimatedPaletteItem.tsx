import { useEffect, useState } from 'react'
import PaletteItem from './PaletteItem.tsx'
import styles from './Palette.module.css'

type AnimatedPaletteItemProps = {
  color: string
  index: number
  onEdit: () => void
  onReroll: () => void
  onDelete: () => void
}

export default function AnimatedPaletteItem({ color, index, onEdit, onReroll, onDelete }: AnimatedPaletteItemProps) {
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
        onEdit={onEdit}
        onReroll={onReroll}
        onDelete={handleDelete}
      />
    </div>
  )
}
