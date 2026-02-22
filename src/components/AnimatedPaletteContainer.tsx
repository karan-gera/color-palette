import { LayoutGroup, AnimatePresence, motion } from 'framer-motion'
import AnimatedPaletteItem from './AnimatedPaletteItem'
import AddColor from './AddColor'
import { getRowSplit, MAX_COLORS, BLUEPRINT_COLOR } from '@/helpers/colorTheory'

const BLUEPRINT_GRID_SIZE = 20
const BLUEPRINT_BG = `
  repeating-linear-gradient(
    0deg,
    ${BLUEPRINT_COLOR} / 0.08 0px,
    transparent 1px,
    transparent ${BLUEPRINT_GRID_SIZE}px
  ),
  repeating-linear-gradient(
    90deg,
    ${BLUEPRINT_COLOR} / 0.08 0px,
    transparent 1px,
    transparent ${BLUEPRINT_GRID_SIZE}px
  ),
  ${BLUEPRINT_COLOR} / 0.03
`

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
  onAdd: () => void
  swapMode: boolean
  swapSelection: number | null
  onSwapClick: (index: number) => void
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
  onAdd,
  swapMode,
  swapSelection,
  onSwapClick,
}: AnimatedPaletteContainerProps) {
  const showAddButton = colors.length < MAX_COLORS && !swapMode

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
      onEditStart={() => onEditStart(globalIndex)}
      onEditSave={(hex) => onEditSave(globalIndex, hex)}
      onEditCancel={onEditCancel}
      onReroll={() => onReroll(globalIndex)}
      onDelete={() => onDelete(globalIndex)}
      onToggleLock={() => onToggleLock(globalIndex)}
      onViewVariations={() => onViewVariations(globalIndex)}
      swapMode={swapMode}
      isSwapSelected={swapSelection === globalIndex}
      onSwapClick={() => onSwapClick(globalIndex)}
    />
  )

  const hasRow2 = row2Colors.length > 0

  return (
    <LayoutGroup>
      <motion.div
        layout
        transition={{
          layout: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
            mass: 0.8,
          },
        }}
        className={`relative rounded-2xl ${swapMode ? 'pt-10 px-6 pb-6' : 'p-0'}`}
        style={swapMode ? {
          background: BLUEPRINT_BG,
          border: `2px dashed ${BLUEPRINT_COLOR}`,
        } : undefined}
      >

        {swapMode && (
          <div
            className="absolute top-2 left-3 font-mono text-xs lowercase select-none"
            style={{ color: BLUEPRINT_COLOR }}
          >
            rearrange mode — select two colors to swap
          </div>
        )}

        <div id="palette-container" className={`flex flex-col items-center${hasRow2 ? ' gap-8' : ''}`}>
          {/* Row 1 — always visible */}
          <div className="flex gap-5 items-start justify-center">
            <AnimatePresence mode="popLayout">
              {row1Colors.map((color, i) => renderItem(color, row1Ids[i], i))}
              {!hasRow2 && showAddButton && (
                <motion.div
                  key="add-color-button"
                  layout
                  layoutId="add-color-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                >
                  <AddColor onAdd={onAdd} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Row 2 — always in the DOM so Framer pre-measures it before items arrive.
              Mounting it conditionally causes a one-frame delay where Framer must wait for the
              new parent to appear before it can start layout animations for the whole group. */}
          <div className="flex gap-5 items-start justify-center">
            <AnimatePresence mode="popLayout">
              {row2Colors.map((color, i) => renderItem(color, row2Ids[i], row1Count + i))}
              {hasRow2 && showAddButton && (
                <motion.div
                  key="add-color-button"
                  layout
                  layoutId="add-color-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                >
                  <AddColor onAdd={onAdd} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </LayoutGroup>
  )
}
