import styles from './Header.module.css'
import ThemeToggle from './ThemeToggle.tsx'

type HeaderProps = {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>{title}</h1>
      <ThemeToggle />
    </div>
  )
}


