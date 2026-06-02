import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  fetchNotifications,
  fetchUnreadCountsByRole,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type RoleUnreadCounts,
} from '../lib/notifications'
import { hasNotificationRoleContext, hasNotificationsTable } from '../lib/schema'
import type { AppMode, Notification, NotificationRoleContext } from '../types/database'

interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  creatorUnreadCount: number
  brandUnreadCount: number
  activeRoleContext: NotificationRoleContext
  loading: boolean
  ready: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

function resolveRoleContext(
  activeMode: AppMode | null,
  hasCreatorProfile: boolean,
  hasBrandProfile: boolean,
): NotificationRoleContext {
  if (activeMode === 'brand' && hasBrandProfile) return 'brand'
  if (activeMode === 'creator' && hasCreatorProfile) return 'creator'
  if (hasBrandProfile && !hasCreatorProfile) return 'brand'
  return 'creator'
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, activeMode, hasCreatorProfile, hasBrandProfile } = useAuth()
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [unreadByRole, setUnreadByRole] = useState<RoleUnreadCounts>({ creator: 0, brand: 0 })
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeRoleContext = useMemo(
    () => resolveRoleContext(activeMode, hasCreatorProfile, hasBrandProfile),
    [activeMode, hasCreatorProfile, hasBrandProfile],
  )

  const notifications = useMemo(
    () => allNotifications.filter((n) => n.role_context === activeRoleContext),
    [allNotifications, activeRoleContext],
  )

  const unreadCount = unreadByRole[activeRoleContext]

  const refresh = useCallback(async () => {
    if (!user || !ready) return

    const roles: NotificationRoleContext[] = []
    if (hasCreatorProfile) roles.push('creator')
    if (hasBrandProfile) roles.push('brand')
    if (roles.length === 0) roles.push(activeRoleContext)

    const [counts, ...lists] = await Promise.all([
      fetchUnreadCountsByRole(user.id),
      ...roles.map((role) => fetchNotifications(user.id, role)),
    ])

    const merged = lists
      .flat()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    setAllNotifications(merged)
    setUnreadByRole(counts)
    setError(null)
  }, [user, ready, hasCreatorProfile, hasBrandProfile, activeRoleContext])

  useEffect(() => {
    Promise.all([hasNotificationsTable(), hasNotificationRoleContext()]).then(
      ([table, roleContext]) => setReady(table && roleContext),
    )
  }, [])

  useEffect(() => {
    if (!user || !ready) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    refresh()
      .catch((err) => {
        if (!cancelled) {
          setAllNotifications([])
          setUnreadByRole({ creator: 0, brand: 0 })
          setError(err instanceof Error ? err.message : 'Failed to load notifications')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    let unsubscribe = () => {}
    try {
      unsubscribe = subscribeToNotifications(user.id, () => {
        refresh().catch(() => undefined)
      })
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to subscribe to notifications')
      }
    }

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [user, ready, refresh])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return

      const target = allNotifications.find((n) => n.id === notificationId)
      if (!target || target.is_read) return

      await markNotificationRead(notificationId, user.id)
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
      )
      setUnreadByRole((prev) => ({
        ...prev,
        [target.role_context]: Math.max(prev[target.role_context] - 1, 0),
      }))
    },
    [user, allNotifications],
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    await markAllNotificationsRead(user.id, activeRoleContext)
    setAllNotifications((prev) =>
      prev.map((n) => (n.role_context === activeRoleContext ? { ...n, is_read: true } : n)),
    )
    setUnreadByRole((prev) => ({ ...prev, [activeRoleContext]: 0 }))
  }, [user, activeRoleContext])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      creatorUnreadCount: unreadByRole.creator,
      brandUnreadCount: unreadByRole.brand,
      activeRoleContext,
      loading,
      ready,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      unreadByRole,
      activeRoleContext,
      loading,
      ready,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
    ],
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}
