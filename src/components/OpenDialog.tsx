import Modal from './Modal.tsx'
import NotificationModal from './NotificationModal.tsx'
import styles from './Modal.module.css'
import type { SavedPalette } from '../helpers/storage.ts'
import { exportAllPalettes, importPalettesFromFile, mergePalettes } from '../helpers/storage.ts'
import { useEffect, useState, useRef } from 'react'

type OpenDialogProps = {
  palettes: SavedPalette[]
  onCancel: () => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onPalettesUpdated: () => void
}

export default function OpenDialog({ palettes, onCancel, onSelect, onRemove, onPalettesUpdated }: OpenDialogProps) {
  const [list, setList] = useState<SavedPalette[]>(palettes)
  const [fading, setFading] = useState<Record<string, boolean>>({})
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setList(palettes)
  }, [palettes])

  const handleExportAll = () => {
    exportAllPalettes()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedPalettes = await importPalettesFromFile(file)
      const result = mergePalettes(importedPalettes)
      onPalettesUpdated()
      
      // Show success message with detailed information
      let message = 'Palettes imported successfully!'
      if (result.duplicates > 0) {
        message += ` (${result.duplicates} duplicate${result.duplicates > 1 ? 's' : ''} skipped)`
      }
      
      setNotificationMessage(message)
      setShowNotification(true)
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
        <div className={styles.actions} style={{ borderTop: '1px solid #e6e6e6', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
          <button className={styles.itemButton} onClick={handleExportAll}>
            Export All
          </button>
          <button className={styles.itemButton} onClick={handleImportClick}>
            Import File
          </button>
          <button className={styles.itemButton} onClick={onCancel}>
            Close
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
      </div>
      {showNotification && (
        <NotificationModal
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </Modal>
  )
}


