import { useState } from 'react'
import { COLOR_RELATIONSHIPS, type ColorRelationship } from '../helpers/colorTheory.ts'
import styles from './Palette.module.css'

type GlobalColorRelationshipSelectorProps = {
  currentRelationship: ColorRelationship
  onRelationshipChange: (relationship: ColorRelationship) => void
  onGlobalReroll: () => void
}

export default function GlobalColorRelationshipSelector({ 
  currentRelationship, 
  onRelationshipChange,
  onGlobalReroll
}: GlobalColorRelationshipSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLabel = COLOR_RELATIONSHIPS.find(r => r.value === currentRelationship)?.label || 'Random'

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '0.5rem',
      marginTop: '1rem'
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className={styles.action}
          onClick={onGlobalReroll}
          style={{ 
            background: '#f0f0f0',
            fontWeight: 'bold',
            border: '2px solid #aaa'
          }}
        >
          Reroll All
        </button>
        <div style={{ position: 'relative' }}>
          <button
            className={styles.action}
            onClick={() => setIsOpen(!isOpen)}
            style={{ minWidth: '160px', textAlign: 'center' }}
          >
            {currentLabel} ▼
          </button>
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff',
                border: '1px solid #cfcfcf',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10,
                marginTop: '2px',
                minWidth: '200px',
              }}
            >
              {COLOR_RELATIONSHIPS.map((rel) => (
                <button
                  key={rel.value}
                  className={styles.dropdownItem}
                  onClick={() => {
                    onRelationshipChange(rel.value)
                    setIsOpen(false)
                  }}
                  title={rel.description}
                  style={{
                    background: rel.value === currentRelationship ? '#f0f0f0' : 'transparent'
                  }}
                >
                  <div style={{ fontWeight: rel.value === currentRelationship ? 'bold' : 'normal' }}>
                    {rel.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                    {rel.description}
                  </div>
                </button>
              ))}
            </div>
          )}
          {isOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9,
              }}
              onClick={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
