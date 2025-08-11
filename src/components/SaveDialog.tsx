import styles from './Modal.module.css'
import Modal from './Modal.tsx'

type SaveDialogProps = {
  defaultName?: string
  onCancel: () => void
  onSave: (name?: string) => void
}

export default function SaveDialog({ defaultName, onCancel, onSave }: SaveDialogProps) {
  let nameValue = defaultName ?? ''
  return (
    <Modal title="save palette" onClose={onCancel}>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          <div style={{ marginBottom: '0.25rem' }}>name</div>
          <input
            className={styles.field}
            defaultValue={nameValue}
            onChange={(e) => {
              nameValue = e.target.value
            }}
            placeholder="optional"
          />
        </label>
        <div className={styles.actions}>
          <button className={styles.itemButton} onClick={onCancel}>cancel</button>
          <button className={styles.itemButton} onClick={() => onSave(nameValue || undefined)}>save</button>
        </div>
      </div>
    </Modal>
  )
}


