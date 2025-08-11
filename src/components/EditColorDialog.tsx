import Modal from './Modal.tsx'
import styles from './Modal.module.css'
import { useState } from 'react'

type EditColorDialogProps = {
  initial: string
  onCancel: () => void
  onSave: (value: string) => void
}

export default function EditColorDialog({ initial, onCancel, onSave }: EditColorDialogProps) {
  const [value, setValue] = useState<string>(initial)
  return (
    <Modal title="edit color" onClose={onCancel}>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          <div style={{ marginBottom: '0.25rem' }}>hex</div>
          <input className={styles.field} value={value} onChange={(e) => setValue(e.target.value)} placeholder="#rrggbb" />
        </label>
        <div className={styles.actions}>
          <button className={styles.itemButton} onClick={onCancel}>cancel</button>
          <button className={styles.itemButton} onClick={() => onSave(value)}>save</button>
        </div>
      </div>
    </Modal>
  )
}


