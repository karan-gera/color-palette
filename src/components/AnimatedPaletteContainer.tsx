import { useCallback } from 'react'
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion'
import AnimatedPaletteItem from './AnimatedPaletteItem'
import AddColor from './AddColor'
import { usePaletteDrag } from '@/hooks/usePaletteDrag'
import { getRowSplit, MAX_COLORS } from '@/helpers/colorTheory'

type AnimatedPaletteContainerProps = {
  colors: string[]
  colorIds: string[]
  lockedStates: boolean[]
  editIndex: number | null
  onEditStart: (index: number) => void
  onEditSave: (index: number, hex: string) => void
  onEditCancel: () => void
  onReroll: (index: number) => void
  onDelete: (index: number) => void
  onToggleLock: (index: number) => void
  onViewVariations: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onAdd: () => void
}

export default function AnimatedPaletteContainer({
  colors,
  colorIds,
  lockedStates,
  editIndex,
  onEditStart,
  onEditSave,
  onEditCancel,
  onReroll,
  onDelete,
  onToggleLock,
  onViewVariations,
  onReorder,
  onAdd,
}: AnimatedPaletteContainerProps) {
  const showAddButton = colors.length < MAX_COLORS

  const {
    dragState,
    setItemRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getItemStyle,
    isDragging,
  } = usePaletteDrag(colors.length, onReorder, editIndex !== null)

  const handleToggleLock = useCallback((index: number) => {
    if (isDragging) return
    onToggleLock(index)
  }, [isDragging, onToggleLock])

  const [row1Count] = getRowSplit(colors.length)
  const row1Colors = colors.slice(0, row1Count)
  const row1Ids = colorIds.slice(0, row1Count)
  const row2Colors = colors.slice(row1Count)
  const row2Ids = colorIds.slice(row1Count)

  const renderItem = (color: string, colorId: string, globalIndex: number) => (
    <AnimatedPaletteItem
      key={colorId}
      layoutId={colorId}
      color={color}
      index={globalIndex}
      isLocked={lockedStates[globalIndex] ?? false}
      isEditing={editIndex === globalIndex}
      isDragging={dragState?.dragIndex === globalIndex}
      dragActive={isDragging}
      itemStyle={getItemStyle(globalIndex)}
      setRef={(el) => setItemRef(globalIndex, el)}
      onDragPointerDown={(e) => onPointerDown(globalIndex, e)}
      onDragPointerMove={onPointerMove}
      onDragPointerUp={onPointerUp}
      onEditStart={() => onEditStart(globalIndex)}
      onEditSave={(hex) => onEditSave(globalIndex, hex)}
      onEditCancel={onEditCancel}
      onReroll={() => onReroll(globalIndex)}
      onDelete={() => onDelete(globalIndex)}
      onToggleLock={() => handleToggleLock(globalIndex)}
      onViewVariations={() => onViewVariations(globalIndex)}
    />
  )

  const hasRow2 = row2Colors.length > 0

  return (
    <LayoutGroup>
      {/* gap-8 is only applied when row 2 is populated; the always-present empty row 2 div
          has 0 height, so no gap would be visible otherwise */}
      <div id="palette-container" className={`flex flex-col items-center${hasRow2 ? ' gap-8' : ''}`}>
        {/* Row 1 — always visible */}
        <div className="flex gap-5 items-start justify-center">
          <AnimatePresence>
            {row1Colors.map((color, i) => renderItem(color, row1Ids[i], i))}
          </AnimatePresence>
          {!hasRow2 && showAddButton && (
            <motion.div layout layoutId="add-color-button" transition={{ type: 'spring', stiffness: 400, damping: 32 }}>
              <AddColor onAdd={onAdd} />
            </motion.div>
          )}
        </div>

        {/* Row 2 — always in the DOM so Framer pre-measures it before items arrive.
            Mounting it conditionally causes a one-frame delay where Framer must wait for the
            new parent to appear before it can start layout animations for the whole group. */}
        <div className="flex gap-5 items-start justify-center">
          <AnimatePresence>
            {row2Colors.map((color, i) => renderItem(color, row2Ids[i], row1Count + i))}
          </AnimatePresence>
          {hasRow2 && showAddButton && (
            <motion.div layout layoutId="add-color-button" transition={{ type: 'spring', stiffness: 400, damping: 32 }}>
              <AddColor onAdd={onAdd} />
            </motion.div>
          )}
        </div>
      </div>
    </LayoutGroup>
  )
}
