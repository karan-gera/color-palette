import { Lock, Unlock } from 'lucide-react'

type LockIconProps = {
  isLocked: boolean
  size?: number
  color?: string
}

export default function LockIcon({ isLocked, size = 24, color = 'currentColor' }: LockIconProps) {
  const Icon = isLocked ? Lock : Unlock
  return <Icon size={size} color={color} strokeWidth={2} />
}
