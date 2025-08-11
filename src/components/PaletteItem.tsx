import { useMemo } from 'react'
import heroStyles from './Hero.module.css'
import styles from './Palette.module.css'

type PaletteItemProps = {
  color: string
  onEdit: () => void
  onReroll: () => void
  onDelete: () => void
}

export default function PaletteItem({ color, onEdit, onReroll, onDelete }: PaletteItemProps) {
  const textColor = useMemo(() => {
    const bg = (color ?? '#ffffff').replace('#', '')
    const r = parseInt(bg.substring(0, 2), 16)
    const g = parseInt(bg.substring(2, 4), 16)
    const b = parseInt(bg.substring(4, 6), 16)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 160 ? '#111111' : '#ffffff'
  }, [color])

  return (
    <>
      <button
        type="button"
        className={heroStyles.hero}
        style={{ ['--hero-bg' as any]: color, ['--hero-fg' as any]: textColor, color: textColor }}
        aria-label={`color ${color}`}
      >
        <span className={heroStyles.plus}>#</span>
      </button>
      <div className={styles.controls}>
        <button className={styles.action} onClick={onEdit}>edit</button>
        <button className={styles.action} onClick={onReroll}>reroll</button>
        <button className={styles.action} onClick={onDelete}>delete</button>
      </div>
    </>
  )
}


