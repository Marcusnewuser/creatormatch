import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import { getProfilePath, getSettingsPath } from '../../lib/auth-paths'
import { useLogout } from '../../hooks/useLogout'
import { cn } from '../../lib/utils'
import type { AppMode } from '../../types/database'

export function UserMenu() {
  const {
    user,
    activeMode,
    creatorProfile,
    brandProfile,
    isAdmin,
  } = useAuth()
  const { logout, loggingOut } = useLogout()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayMode: AppMode | 'admin' = isAdmin ? 'admin' : (activeMode ?? 'creator')

  const emailName = user?.email?.split('@')[0] ?? 'User'
  let displayName = emailName
  let avatarUrl: string | undefined

  if (displayMode === 'creator' && creatorProfile) {
    displayName = creatorProfile.full_name ?? emailName
    avatarUrl = creatorProfile.avatar_url ?? undefined
  } else if (displayMode === 'brand' && brandProfile) {
    displayName = brandProfile.company_name ?? emailName
    avatarUrl = brandProfile.logo_url ?? undefined
  } else if (displayMode === 'admin') {
    displayName = 'Admin'
  }

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

  if (!user) return null

  const profilePath = getProfilePath(displayMode)
  const settingsPath = getSettingsPath(displayMode)

  async function handleLogout() {
    setOpen(false)
    await logout()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-2.5',
          'hover:bg-gray-50 transition-colors',
          open && 'ring-2 ring-brand-primary/20',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <Avatar src={avatarUrl} name={displayName} size="sm" />
        <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-text-primary">
          {displayName}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-text-secondary transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white py-1 shadow-elevated animate-fade-in z-50"
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
            <p className="text-xs text-text-secondary truncate">{user.email}</p>
          </div>

          <Link
            to={profilePath}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
          >
            <User className="h-4 w-4 text-text-secondary" />
            Profile
          </Link>

          <Link
            to={settingsPath}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 text-text-secondary" />
            Settings
          </Link>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Logging out…' : 'Log Out'}
          </button>
        </div>
      )}
    </div>
  )
}
