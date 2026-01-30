import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { calculateMaxRadius } from '@/hooks/useCircleWipe'

export interface CircleWipeConfig {
  /** CSS filter to apply (for CVD transitions) */
  filter?: string
  /** data-theme attribute to apply (for theme transitions) */
  theme?: string
  /** Old theme (for mask approach) */
  oldTheme?: string
  /** Old filter (for mask approach) */
  oldFilter?: string
  /** Animation type: 'circle' (default) or 'horizontal' */
  animationType?: 'circle' | 'horizontal'
}

interface CircleWipeOverlayProps {
  isActive: boolean
  origin: { x: number; y: number } | null
  config: CircleWipeConfig
  /** Called immediately to apply new state (while overlay masks the change) */
  onApplyState: () => void
  /** Called when animation completes (to clean up transition state) */
  onAnimationEnd: () => void
}

// Exported so it can be adjusted universally
export const CIRCLE_WIPE_DURATION = 800 // ms

// Theme-specific background colors (must match index.css)
const THEME_BACKGROUNDS: Record<string, string> = {
  light: 'oklch(0.98 0 0)',
  gray: 'oklch(0.55 0 0)',
  dark: 'oklch(0.12 0 0)',
}

/**
 * Circle wipe transition using an "expanding new content" approach:
 * 
 * 1. Clone current content (OLD state)
 * 2. Apply NEW state to real content immediately (hidden by overlay)
 * 3. Show overlay with OLD content at full coverage
 * 4. Overlay SHRINKS from full to 0, revealing NEW content underneath
 * 5. Effect: New content appears to "expand" outward from click point
 * 
 * This ensures ALL content (including text) updates properly because the
 * real DOM has the new state - the overlay just reveals it gradually.
 */
export default function CircleWipeOverlay({ 
  isActive, 
  origin, 
  config,
  onApplyState,
  onAnimationEnd 
}: CircleWipeOverlayProps) {
  const [phase, setPhase] = useState<'idle' | 'ready' | 'animating' | 'done'>('idle')
  const [clonedContent, setClonedContent] = useState<string>('')
  const maxRadiusRef = useRef(0)
  const originRef = useRef({ x: 0, y: 0 })
  const configRef = useRef(config)
  
  // Keep callbacks in refs to avoid effect deps issues
  const onApplyStateRef = useRef(onApplyState)
  const onAnimationEndRef = useRef(onAnimationEnd)
  onApplyStateRef.current = onApplyState
  onAnimationEndRef.current = onAnimationEnd
  
  // Track if we've started this transition
  const hasStartedRef = useRef(false)
  
  // Reset ref when deactivated
  useEffect(() => {
    if (!isActive) {
      hasStartedRef.current = false
    }
  }, [isActive])
  
  useEffect(() => {
    // Reset when deactivated
    if (!isActive || !origin) {
      setPhase('idle')
      setClonedContent('')
      return
    }
    
    // Already started this transition
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    
    // Store values
    maxRadiusRef.current = calculateMaxRadius(origin)
    originRef.current = origin
    configRef.current = config
    
    // Clone the wrapper content BEFORE applying new state
    const wrapper = document.getElementById('cvd-wrapper')
    if (wrapper) {
      setClonedContent(wrapper.innerHTML)
    }
    
    // Phase 1: Ready - overlay visible at full coverage with OLD content
    setPhase('ready')
    
    // Apply NEW state to real content immediately (masked by overlay)
    onApplyStateRef.current()
    
    // Phase 2: Start animation after a frame (let React render)
    const animateTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPhase('animating')
      })
    })
    
    // Phase 3: Done after animation completes
    const doneTimer = setTimeout(() => {
      setPhase('done')
      setClonedContent('')
      onAnimationEndRef.current()
    }, CIRCLE_WIPE_DURATION + 50)
    
    return () => {
      cancelAnimationFrame(animateTimer)
      clearTimeout(doneTimer)
    }
  }, [isActive, origin, config])
  
  // Don't render if not active or done
  if (!isActive || phase === 'idle' || phase === 'done') return null
  if (!clonedContent) return null
  
  const { x, y } = originRef.current
  const maxRadius = maxRadiusRef.current
  const activeConfig = configRef.current
  const animationType = activeConfig.animationType || 'circle'
  
  // Get OLD theme background (what we're transitioning FROM)
  const oldBackground = activeConfig.oldTheme 
    ? THEME_BACKGROUNDS[activeConfig.oldTheme] 
    : 'var(--background)'
  
  // Calculate clip-path based on animation type
  let clipPath: string
  
  if (animationType === 'horizontal') {
    // Horizontal wipe: left-to-right reveal
    // inset(top right bottom left) - animate left edge moving right
    clipPath = phase === 'ready'
      ? 'inset(0 0 0 0)'           // Full coverage
      : 'inset(0 0 0 100%)'        // Nothing visible (left edge at 100%)
  } else {
    // Circle wipe: shrink from click point
    clipPath = phase === 'ready'
      ? `circle(${maxRadius}px at ${x}px ${y}px)`
      : `circle(0px at ${x}px ${y}px)`
  }
  
  const overlay = (
    <div
      data-theme={activeConfig.oldTheme || undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        pointerEvents: 'none',
        clipPath,
        transition: phase === 'animating' 
          ? `clip-path ${CIRCLE_WIPE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)` 
          : 'none',
        filter: activeConfig.oldFilter || undefined,
        backgroundColor: oldBackground,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* OLD content clone - shrinks/wipes away to reveal new content */}
      <div
        className="min-h-screen p-8 flex flex-col items-center gap-6"
        dangerouslySetInnerHTML={{ __html: clonedContent }}
      />
    </div>
  )
  
  return createPortal(overlay, document.body)
}
