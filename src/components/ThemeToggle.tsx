import { useState, useEffect } from 'react'
import styles from './ThemeToggle.module.css'

type ThemeToggleProps = {
  onThemeChange?: (isDark: boolean) => void
}

export default function ThemeToggle({ onThemeChange }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('color-palette:theme')
    return saved === 'dark'
  })

  useEffect(() => {
    localStorage.setItem('color-palette:theme', isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    onThemeChange?.(isDark)
  }, [isDark, onThemeChange])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
