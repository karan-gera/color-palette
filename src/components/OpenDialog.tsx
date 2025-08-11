import Modal from './Modal.tsx'
import styles from './Modal.module.css'
import type { SavedPalette } from '../helpers/storage.ts'
import { useEffect, useState } from 'react'

type OpenDialogProps = {
  palettes: SavedPalette[]
  onCancel: () => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

export default function OpenDialog({ palettes, onCancel, onSelect, onRemove }: OpenDialogProps) {
  const [list, setList] = useState<SavedPalette[]>(palettes)
  const [fading, setFading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setList(palettes)
  }, [palettes])

  return (
    <Modal title="open palette" onClose={onCancel}>
      <div className={styles.list}>
        {list.length === 0 ? (
          <div style={{ opacity: 0.7 }}>no saved palettes</div>
        ) : (
          list.map((p) => (
            <div key={p.id} className={`${styles.item} ${fading[p.id] ? styles.itemFade : ''}`}>
              <div style={{ display: 'grid' }}>
                <strong>{p.name}</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(p.savedAt).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className={styles.itemButton} onClick={() => onSelect(p.id)}>load</button>
                <button
                  className={styles.itemButton}
                  onClick={() => {
                    setFading((prev) => ({ ...prev, [p.id]: true }))
                    // wait for fade-out then remove
                    setTimeout(() => {
                      onRemove(p.id)
                      setList((prev) => prev.filter((x) => x.id !== p.id))
                    }, 300)
                  }}
                >
                  delete
                </button>
              </div>
            </div>
          ))
        )}
        <div className={styles.actions}>
          <button className={styles.itemButton} onClick={onCancel}>close</button>
        </div>
      </div>
    </Modal>
  )
}


