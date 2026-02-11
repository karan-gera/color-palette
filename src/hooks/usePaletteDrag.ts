import { useCallback, useRef, useState } from 'react'

type DragState = {
  dragIndex: number
  overIndex: number
  offsetX: number
  offsetY: number
}

type ItemRect = { left: number; right: number; centerX: number }

const DRAG_THRESHOLD = 8

export function usePaletteDrag(
  itemCount: number,
  onReorder: (fromIndex: number, toIndex: number) => void,
  disabled: boolean = false,
) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const pendingIndex = useRef<number | null>(null)
  const itemRects = useRef<ItemRect[]>([])
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const activated = useRef(false)
  // Track the element for pointer capture
  const captureTarget = useRef<HTMLElement | null>(null)

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    itemRefs.current[index] = el
  }, [])

  const snapshotRects = useCallback(() => {
    itemRects.current = itemRefs.current
      .slice(0, itemCount)
      .map((el) => {
        if (!el) return { left: 0, right: 0, centerX: 0 }
        const r = el.getBoundingClientRect()
        return { left: r.left, right: r.right, centerX: r.left + r.width / 2 }
      })
  }, [itemCount])

  const computeOverIndex = useCallback((pointerX: number, dragIndex: number) => {
    const rects = itemRects.current
    if (rects.length === 0) return dragIndex

    // Find the position the dragged item should be inserted at
    // by comparing pointer X against midpoints of other items
    for (let i = 0; i < rects.length; i++) {
      if (i === dragIndex) continue
      if (pointerX < rects[i].centerX) {
        return i < dragIndex ? i : i
      }
    }
    // Past all items — drop at end
    return rects.length - 1
  }, [])

  const onPointerDown = useCallback((index: number, e: React.PointerEvent) => {
    if (disabled || itemCount < 2) return
    // Only handle primary button (left click / touch)
    if (e.button !== 0) return

    startPos.current = { x: e.clientX, y: e.clientY }
    pendingIndex.current = index
    activated.current = false
    captureTarget.current = e.currentTarget as HTMLElement

    // Capture pointer events on the element
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [disabled, itemCount])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (startPos.current === null || pendingIndex.current === null) return

    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (!activated.current) {
      if (distance < DRAG_THRESHOLD) return
      // Activate drag
      activated.current = true
      snapshotRects()
    }

    const dragIndex = pendingIndex.current
    const pointerX = e.clientX
    const overIndex = computeOverIndex(pointerX, dragIndex)

    setDragState({
      dragIndex,
      overIndex,
      offsetX: dx,
      offsetY: dy,
    })
  }, [snapshotRects, computeOverIndex])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (captureTarget.current) {
      try { captureTarget.current.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    }

    if (activated.current && dragState) {
      const { dragIndex, overIndex } = dragState
      if (dragIndex !== overIndex) {
        onReorder(dragIndex, overIndex)
      }
    }

    startPos.current = null
    pendingIndex.current = null
    activated.current = false
    captureTarget.current = null
    setDragState(null)
  }, [dragState, onReorder])

  const getItemStyle = useCallback((index: number): React.CSSProperties => {
    if (!dragState) return {}

    const { dragIndex, overIndex, offsetX, offsetY } = dragState

    // The dragged item follows the pointer
    if (index === dragIndex) {
      return {
        transform: `translate(${offsetX}px, ${offsetY}px) scale(1.05)`,
        zIndex: 50,
        transition: 'box-shadow 200ms ease-out',
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.25))',
        pointerEvents: 'none',
      }
    }

    // Other items slide to make room
    // Calculate the shift: items between dragIndex and overIndex need to move
    const rects = itemRects.current
    if (rects.length === 0) return {}

    const slotWidth = rects.length > 1
      ? rects[1].centerX - rects[0].centerX
      : 0

    let shift = 0
    if (dragIndex < overIndex) {
      // Dragging right: items between (dragIndex, overIndex] shift left
      if (index > dragIndex && index <= overIndex) {
        shift = -slotWidth
      }
    } else if (dragIndex > overIndex) {
      // Dragging left: items between [overIndex, dragIndex) shift right
      if (index >= overIndex && index < dragIndex) {
        shift = slotWidth
      }
    }

    if (shift === 0) return {}

    return {
      transform: `translateX(${shift}px)`,
      transition: 'transform 200ms ease-out',
    }
  }, [dragState])

  const isDragging = dragState !== null && activated.current

  return {
    dragState: isDragging ? dragState : null,
    setItemRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getItemStyle,
    isDragging,
  }
}
