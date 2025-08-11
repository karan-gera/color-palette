import React from 'react'
import styles from './Controls.module.css'

type ControlsProps = {
  onOpen: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export default function Controls({
  onOpen,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ControlsProps) {
  return (
    <div className={styles.row}>
      <button className={styles.btn} onClick={onOpen}>
        open
      </button>
      <button className={styles.btn} onClick={onSave}>
        load
      </button>
      <button className={`${styles.btn} ${!canUndo ? styles.disabled : ''}`} onClick={onUndo} disabled={!canUndo}>
        [undo]
      </button>
      <button className={`${styles.btn} ${!canRedo ? styles.disabled : ''}`} onClick={onRedo} disabled={!canRedo}>
        [redo]
      </button>
    </div>
  )
}


