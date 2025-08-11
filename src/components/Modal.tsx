import type { PropsWithChildren } from 'react'
import styles from './Modal.module.css'

type ModalProps = PropsWithChildren<{
  title?: string
  onClose: () => void
}>

export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {title ? <h2 className={styles.title}>{title}</h2> : null}
        {children}
      </div>
    </div>
  )
}


