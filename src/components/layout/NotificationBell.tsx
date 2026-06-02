import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationsContext'
import { getNotificationsPath } from '../../lib/auth-paths'
import { formatRelativeTime } from '../../lib/constants'
import { getNotificationLink } from '../../lib/notifications'
import { cn } from '../../lib/utils'

function formatBadgeCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

export function NotificationBell() {
  const { notifications, unreadCount, activeRoleContext, loading, ready, markAsRead, markAllAsRead } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const recent = notifications.slice(0, 5)
  const centerPath = getNotificationsPath()
  const modeLabel = activeRoleContext === 'brand' ? 'Brand' : 'Creator'

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
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!ready) return null

  async function handleOpenNotification(id: string, isRead: boolean) {
    if (!isRead) {
      try {
        await markAsRead(id)
      } catch {
        // ignore — user still navigates
      }
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white',
          'hover:bg-gray-50 transition-colors',
          open && 'ring-2 ring-brand-primary/20',
        )}
        aria-label={`${modeLabel} notifications`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {formatBadgeCount(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-elevated animate-fade-in',
              'fixed left-3 right-3 top-[4.25rem] max-h-[min(28rem,calc(100dvh-5.5rem))]',
              'sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-96',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
              <div>
                <p className="text-sm font-semibold text-text-primary">Notifications</p>
                <p className="text-xs text-text-secondary">{modeLabel} mode</p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead().catch(() => undefined)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <p className="px-4 py-6 text-center text-sm text-text-secondary">Loading…</p>
              ) : recent.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-secondary">
                  No {modeLabel.toLowerCase()} notifications yet
                </p>
              ) : (
                recent.map((notification) => (
                  <Link
                    key={notification.id}
                    to={getNotificationLink(notification.type)}
                    onClick={() => handleOpenNotification(notification.id, notification.is_read)}
                    className={cn(
                      'block border-b border-border px-4 py-3 hover:bg-gray-50 transition-colors last:border-b-0',
                      !notification.is_read && 'bg-brand-light/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary">{notification.title}</p>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-text-secondary">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </div>

            <Link
              to={centerPath}
              onClick={() => setOpen(false)}
              className="block shrink-0 border-t border-border px-4 py-3 text-center text-sm font-medium text-brand-primary hover:bg-gray-50"
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
