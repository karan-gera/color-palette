import heroStyles from './Hero.module.css'

type AddColorProps = {
  onAdd: () => void
}

export default function AddColor({ onAdd }: AddColorProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={heroStyles.hero}
      style={{ ['--hero-bg' as any]: '#ffffff', ['--hero-fg' as any]: '#111111' }}
      aria-label="Add color"
    >
      <span className={heroStyles.plus}>+</span>
    </button>
  )
}


