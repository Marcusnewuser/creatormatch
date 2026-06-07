import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationsContext'
import { getNotificationsPath } from '../../lib/auth-paths'
import { cn } from '../../lib/utils'

function formatBadgeCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

interface NotificationBellLinkProps {
  className?: string
}

/** Home shortcut — tap navigates to the notifications page (Settings keeps preferences). */
export function NotificationBellLink({ className }: NotificationBellLinkProps) {
  const { unreadCount, ready, activeAccountType } = useNotifications()
  const modeLabel = activeAccountType === 'brand' ? 'Brand' : 'Creator'

  if (!ready) return null

  return (
    <Link
      to={getNotificationsPath()}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white',
        'hover:bg-gray-50 transition-colors',
        className,
      )}
      aria-label={`${modeLabel} notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell className="h-5 w-5 text-text-secondary" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {formatBadgeCount(unreadCount)}
        </span>
      )}
    </Link>
  )
}
