import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getSettingsPath } from '../../lib/auth-paths'
import { cn } from '../../lib/utils'

interface ProfileSettingsButtonProps {
  className?: string
}

export function ProfileSettingsButton({ className }: ProfileSettingsButtonProps) {
  const { activeMode, isAdmin } = useAuth()
  const settingsPath = getSettingsPath(isAdmin ? 'admin' : activeMode)

  return (
    <Link
      to={settingsPath}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/95 text-text-secondary',
        'shadow-soft backdrop-blur-sm hover:bg-gray-50 hover:text-text-primary transition-colors',
        className,
      )}
      aria-label="Settings"
    >
      <Settings className="h-5 w-5" />
    </Link>
  )
}
