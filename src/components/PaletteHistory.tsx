import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaletteHistoryProps = {
  history: string[][]
  currentIndex: number
  expanded: boolean
  onToggle: () => void
  onRestore: (index: number) => void
}

const SCROLL_AMOUNT = 228 // ~4 thumbnails wide

export default function PaletteHistory({ history, currentIndex, expanded, onToggle, onRestore }: PaletteHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const expandedRef = useRef(expanded)
  const prevLengthRef = useRef(history.length)

  useEffect(() => { expandedRef.current = expanded }, [expanded])

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener('scroll', updateScrollState)
  }, [updateScrollState])

  // Re-check overflow indicators when panel opens
  useEffect(() => {
    if (expanded) requestAnimationFrame(updateScrollState)
  }, [expanded, updateScrollState])

  // Scroll to end when a new entry is pushed
  useEffect(() => {
    if (history.length > prevLengthRef.current) {
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTo({ left: el.scrollWidth, behavior: expandedRef.current ? 'smooth' : 'instant' })
      })
    }
    prevLengthRef.current = history.length
  }, [history.length])

  // Scroll to current thumbnail when jumping (user clicks a thumbnail / undo / redo)
  useEffect(() => {
    if (!expanded || !scrollRef.current) return
    const child = scrollRef.current.children[currentIndex] as HTMLElement | undefined
    child?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [currentIndex, expanded])

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' })
  }, [])

  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' })
  }, [])

  return (
    <div className="w-full flex flex-col items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="font-mono text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7 lowercase"
      >
        history
        {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
      </Button>

      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-out ${
          expanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground lowercase shrink-0">
            {history.length > 0 ? `${currentIndex + 1}/${history.length}` : '—'}
          </span>

          <div className="relative flex-1 min-w-0">
            {/* Scroll track */}
            <div
              ref={scrollRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-none py-1 px-5"
            >
              <AnimatePresence initial={false}>
                {history.map((snapshot, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    onClick={() => onRestore(i)}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{
                      opacity: i === currentIndex ? 1 : i < currentIndex ? 0.6 : 0.3,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    whileHover={i !== currentIndex ? { opacity: i < currentIndex ? 1 : 0.6 } : undefined}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`shrink-0 h-8 w-14 rounded-md border overflow-hidden cursor-pointer ${
                      i === currentIndex ? 'ring-2 ring-ring' : ''
                    }`}
                    aria-label={`restore palette snapshot ${i + 1}`}
                    aria-current={i === currentIndex ? 'true' : undefined}
                  >
                    <div className="flex h-full">
                      {snapshot.map((color, j) => (
                        <div key={j} className="flex-1 h-full" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Left fade + scroll button */}
            <div className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center pointer-events-none">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
                  canScrollLeft ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <button
                type="button"
                onClick={scrollLeft}
                tabIndex={canScrollLeft ? 0 : -1}
                aria-label="scroll history left"
                className={`relative pointer-events-auto text-muted-foreground hover:text-foreground transition-all duration-200 ${
                  canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ChevronLeft className="size-3.5" />
              </button>
            </div>

            {/* Right fade + scroll button */}
            <div className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-end pointer-events-none">
              <div
                className={`absolute inset-0 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${
                  canScrollRight ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <button
                type="button"
                onClick={scrollRight}
                tabIndex={canScrollRight ? 0 : -1}
                aria-label="scroll history right"
                className={`relative pointer-events-auto text-muted-foreground hover:text-foreground transition-all duration-200 ${
                  canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
