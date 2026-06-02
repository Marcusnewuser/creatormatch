import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Camera, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationsContext'
import { getModeHomePath } from '../../lib/account-mode'
import type { AppMode } from '../../types/database'
import { cn } from '../../lib/utils'

const modes: { key: AppMode; label: string; icon: typeof Camera }[] = [
  { key: 'creator', label: 'Creator', icon: Camera },
  { key: 'brand', label: 'Brand', icon: Building2 },
]

export function ModeSwitcher() {
  const navigate = useNavigate()
  const {
    activeMode,
    hasCreatorProfile,
    hasBrandProfile,
    isAdmin,
    switchMode,
  } = useAuth()
  const { creatorUnreadCount, brandUnreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  if (isAdmin) return null

  const current = modes.find((m) => m.key === activeMode) ?? modes[0]

  function handleSelect(mode: AppMode) {
    setOpen(false)

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
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5',
          'hover:bg-gray-50 transition-colors text-sm',
          open && 'ring-2 ring-brand-primary/20',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch account mode"
      >
        <current.icon className="h-4 w-4 text-brand-primary" />
        <span className="hidden sm:inline text-text-secondary">Current Mode</span>
        <span className="font-medium text-text-primary">{current.label}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-text-secondary transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Account mode"
          className="absolute left-0 mt-2 w-52 rounded-xl border border-border bg-white py-1 shadow-elevated animate-fade-in z-50"
        >
          {modes.map(({ key, label, icon: Icon }) => {
            const hasProfile = key === 'creator' ? hasCreatorProfile : hasBrandProfile
            const isActive = activeMode === key
            const unreadCount = key === 'creator' ? creatorUnreadCount : brandUnreadCount

            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(key)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-brand-light text-brand-primary font-medium'
                    : 'text-text-primary hover:bg-gray-50',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {hasProfile && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {!hasProfile && (
                  <span className="text-xs text-text-secondary">Set up</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
