import { useMemo, useState } from 'react'
import heroStyles from './Hero.module.css'
import styles from './Palette.module.css'
import LockIcon from './LockIcon.tsx'

type PaletteItemProps = {
  color: string
  isLocked: boolean
  onEdit: () => void
  onReroll: () => void
  onDelete: () => void
  onToggleLock: () => void
}

export default function PaletteItem({ color, isLocked, onEdit, onReroll, onDelete, onToggleLock }: PaletteItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const textColor = useMemo(() => {
    const bg = (color ?? '#ffffff').replace('#', '')
    const r = parseInt(bg.substring(0, 2), 16)
    const g = parseInt(bg.substring(2, 4), 16)
    const b = parseInt(bg.substring(4, 6), 16)
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 160 ? '#111111' : '#ffffff'
  }, [color])

  const showLockIcon = isLocked || isHovered

  return (
    <>
      <button
        type="button"
        className={heroStyles.hero}
        style={{ ['--hero-bg' as any]: color, ['--hero-fg' as any]: textColor, color: textColor }}
        aria-label={`${isLocked ? 'Unlock' : 'Lock'} color ${color}`}
        onClick={onToggleLock}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showLockIcon && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.2s ease',
            opacity: isLocked ? 1 : 0.8,
          }}>
            <LockIcon isLocked={isLocked} size={32} color={textColor} />
          </div>
        )}
      </button>
      <div className={styles.controls}>
        <button className={styles.action} onClick={onEdit}>edit</button>
        <button 
          className={styles.action} 
          onClick={onReroll}
          disabled={isLocked}
          style={{ opacity: isLocked ? 0.45 : 1 }}
        >
          reroll
        </button>
        <button className={styles.action} onClick={onDelete}>delete</button>
      </div>
    </>
  )
}


