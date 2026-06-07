import { useNavigate } from 'react-router-dom'
import { Building2, Camera } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMessages } from '../../contexts/MessagesContext'
import { getModeHomePath } from '../../lib/account-mode'
import type { AppMode } from '../../types/database'
import { cn } from '../../lib/utils'

const modes: { key: AppMode; label: string; icon: typeof Camera }[] = [
  { key: 'creator', label: 'Creator', icon: Camera },
  { key: 'brand', label: 'Brand', icon: Building2 },
]

export function ProfileModeSwitcher() {
  const navigate = useNavigate()
  const { activeMode, hasCreatorProfile, hasBrandProfile, isAdmin, switchMode } = useAuth()
  const { creatorUnreadCount, brandUnreadCount } = useMessages()

  if (isAdmin || (!hasCreatorProfile && !hasBrandProfile)) return null

  function handleSelect(mode: AppMode) {
    if (mode === 'creator') {
      if (!hasCreatorProfile) {
        navigate('/creator/profile/create')
        return
      }
      switchMode('creator')
      navigate(getModeHomePath('creator'))
      return
    }

    if (!hasBrandProfile) {
      navigate('/brand/profile/create')
      return
    }
    switchMode('brand')
    navigate(getModeHomePath('brand'))
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {modes.map(({ key, label, icon: Icon }) => {
        const hasProfile = key === 'creator' ? hasCreatorProfile : hasBrandProfile
        const isActive = activeMode === key
        const unreadCount = key === 'creator' ? creatorUnreadCount : brandUnreadCount

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleSelect(key)}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors',
              isActive
                ? 'border-brand-primary bg-brand-light text-brand-primary font-medium'
                : 'border-border bg-white text-text-primary hover:border-brand-primary/30',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            {!hasProfile && <span className="text-[10px] text-text-secondary">Set up</span>}
            {hasProfile && unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
