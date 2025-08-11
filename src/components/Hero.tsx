import React, { useMemo } from 'react'
import styles from './Hero.module.css'

type HeroProps = {
  color: string | null
  onClick: () => void
}

export default function Hero({ color, onClick }: HeroProps) {
  const textColor = useMemo(() => {
    const bg = (color ?? '#ffffff').replace('#', '')
    const r = parseInt(bg.substring(0, 2), 16)
    const g = parseInt(bg.substring(2, 4), 16)
    const b = parseInt(bg.substring(4, 6), 16)
    // Relative luminance approximation
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance > 160 ? '#111111' : '#ffffff'
  }, [color])

  return (
    <button
      type="button"
      onClick={onClick}
      className={styles.hero}
      style={{ backgroundColor: color ?? '#ffffff', color: textColor }}
      aria-label="Generate color"
    >
      <span className={styles.plus}>+</span>
    </button>
  )
}


