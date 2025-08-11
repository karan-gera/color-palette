type LockIconProps = {
  isLocked: boolean
  size?: number
  color?: string
}

export default function LockIcon({ isLocked, size = 24, color = 'currentColor' }: LockIconProps) {
  if (isLocked) {
    // Locked icon - completely filled
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="10" width="12" height="8" rx="2" fill={color}/>
        <path d="M8 10V6a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  } else {
    // Unlocked icon - completely filled, shackle raised higher for distinction
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="10" width="12" height="8" rx="2" fill={color}/>
        <path d="M8 10V6a4 4 0 0 1 8 0V4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  }
}
