import Modal from './Modal.tsx'
import styles from './Modal.module.css'

type NotificationModalProps = {
  message: string
  onClose: () => void
}

export default function NotificationModal({ message, onClose }: NotificationModalProps) {
  return (
    <Modal title="" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ 
          fontSize: '1rem', 
          fontFamily: 'monospace', 
          marginBottom: '1.5rem',
          lineHeight: 1.4
        }}>
          {message}
        </div>
        <div className={styles.actions}>
          <button className={styles.itemButton} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </Modal>
  )
}
