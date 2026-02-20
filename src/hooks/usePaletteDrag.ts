import { useCallback, useRef, useState } from 'react'

type DragState = {
  dragIndex: number
  overIndex: number
  offsetX: number
  offsetY: number
}

type ItemRect = { left: number; right: number; centerX: number; centerY: number }

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
  const captureTarget = useRef<HTMLElement | null>(null)

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    itemRefs.current[index] = el
  }, [])

  const snapshotRects = useCallback(() => {
    itemRects.current = itemRefs.current
      .slice(0, itemCount)
      .map((el) => {
        if (!el) return { left: 0, right: 0, centerX: 0, centerY: 0 }
        const r = el.getBoundingClientRect()
        return {
          left: r.left,
          right: r.right,
          centerX: r.left + r.width / 2,
          centerY: r.top + r.height / 2,
        }
      })
  }, [itemCount])

  // 2D nearest-center: find which item center is closest to the pointer
  const computeOverIndex = useCallback((pointerX: number, pointerY: number, dragIndex: number) => {
    const rects = itemRects.current
    if (rects.length === 0) return dragIndex

    let nearest = dragIndex
    let minDist = Infinity
    for (let i = 0; i < rects.length; i++) {
      const dx = rects[i].centerX - pointerX
      const dy = rects[i].centerY - pointerY
      const dist = dx * dx + dy * dy
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    }
    return nearest
  }, [])

  const onPointerDown = useCallback((index: number, e: React.PointerEvent) => {
    if (disabled || itemCount < 2) return
    if (e.button !== 0) return

    startPos.current = { x: e.clientX, y: e.clientY }
    pendingIndex.current = index
    activated.current = false
    captureTarget.current = e.currentTarget as HTMLElement

    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [disabled, itemCount])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (startPos.current === null || pendingIndex.current === null) return

    const dx = e.clientX - startPos.current.x
    const dy = e.clientY - startPos.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (!activated.current) {
      if (distance < DRAG_THRESHOLD) return
      activated.current = true
      snapshotRects()
    }

    const dragIndex = pendingIndex.current
    const overIndex = computeOverIndex(e.clientX, e.clientY, dragIndex)

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

    // Slide items within the same row to make room during drag.
    // Items in a different row don't shift.
    const rects = itemRects.current
    if (rects.length === 0) return {}

    const dragRect = rects[dragIndex]
    const itemRect = rects[index]
    if (!dragRect || !itemRect) return {}

    // Determine row membership by Y proximity (items in same row have similar centerY)
    const rowThreshold = 50 // px — if centerY differs by more than this, different row
    const sameRowAsDrag = Math.abs(itemRect.centerY - dragRect.centerY) < rowThreshold
    if (!sameRowAsDrag) return {}

    // Compute slot width from adjacent same-row items
    const sameRowRects = rects.filter(r => Math.abs(r.centerY - dragRect.centerY) < rowThreshold)
    const slotWidth = sameRowRects.length > 1
      ? sameRowRects[1].centerX - sameRowRects[0].centerX
      : 0

    let shift = 0
    if (dragIndex < overIndex) {
      if (index > dragIndex && index <= overIndex) shift = -slotWidth
    } else if (dragIndex > overIndex) {
      if (index >= overIndex && index < dragIndex) shift = slotWidth
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
