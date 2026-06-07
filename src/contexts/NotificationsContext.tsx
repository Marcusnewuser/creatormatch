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
import { filterNotificationsForAccount } from '../lib/notification-account'
import { hasNotificationsTable } from '../lib/schema'
import { isAdmin } from '../lib/account-mode'
import type { AppMode, Notification, NotificationAccountType } from '../types/database'

interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  creatorUnreadCount: number
  brandUnreadCount: number
  activeAccountType: NotificationAccountType
  loading: boolean
  ready: boolean
  error: string | null
  refresh: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

function resolveAccountType(
  activeMode: AppMode | null,
  hasCreatorProfile: boolean,
  hasBrandProfile: boolean,
): NotificationAccountType {
  if (activeMode === 'brand' && hasBrandProfile) return 'brand'
  if (activeMode === 'creator' && hasCreatorProfile) return 'creator'
  if (hasBrandProfile && !hasCreatorProfile) return 'brand'
  return 'creator'
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, profile, activeMode, hasCreatorProfile, hasBrandProfile } = useAuth()
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([])
  const [unreadByRole, setUnreadByRole] = useState<RoleUnreadCounts>({ creator: 0, brand: 0 })
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeAccountType = useMemo((): NotificationAccountType => {
    if (isAdmin(profile)) return 'admin'
    return resolveAccountType(activeMode, hasCreatorProfile, hasBrandProfile)
  }, [profile, activeMode, hasCreatorProfile, hasBrandProfile])

  const notifications = useMemo(
    () => filterNotificationsForAccount(activeNotifications, activeAccountType),
    [activeNotifications, activeAccountType],
  )

  const unreadCount =
    activeAccountType === 'admin'
      ? activeNotifications.filter((n) => n.account_type === 'admin' && !n.is_read).length
      : unreadByRole[activeAccountType]

  const refresh = useCallback(async () => {
    if (!user || !ready) return

    if (isAdmin(profile)) {
      const list = await fetchNotifications(user.id, 'admin')
      setActiveNotifications(list)
      setUnreadByRole({ creator: 0, brand: 0 })
      setError(null)
      return
    }

    const [counts, list] = await Promise.all([
      fetchUnreadCountsByRole(user.id),
      fetchNotifications(user.id, activeAccountType),
    ])

    setActiveNotifications(list)
    setUnreadByRole(counts)
    setError(null)
  }, [user, profile, ready, activeAccountType])

  useEffect(() => {
    if (!user) {
      setReady(false)
      setLoading(false)
      setActiveNotifications([])
      setUnreadByRole({ creator: 0, brand: 0 })
      return
    }

    let cancelled = false
    hasNotificationsTable().then((tableReady) => {
      if (!cancelled) setReady(tableReady)
    })

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user || !ready) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    refresh()
      .catch((err) => {
        if (!cancelled) {
          setActiveNotifications([])
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
  }, [user, ready, activeAccountType, refresh])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return

      const target = activeNotifications.find((n) => n.id === notificationId)
      if (!target || target.is_read) return

      await markNotificationRead(notificationId, user.id)
      setActiveNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
      )
      if (target.account_type === 'creator' || target.account_type === 'brand') {
        const role = target.account_type
        setUnreadByRole((prev) => ({
          ...prev,
          [role]: Math.max(prev[role] - 1, 0),
        }))
      }
    },
    [user, activeNotifications],
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return

    await markAllNotificationsRead(user.id, activeAccountType)
    setActiveNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    if (activeAccountType !== 'admin') {
      setUnreadByRole((prev) => ({ ...prev, [activeAccountType]: 0 }))
    }
  }, [user, activeAccountType])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      creatorUnreadCount: unreadByRole.creator,
      brandUnreadCount: unreadByRole.brand,
      activeAccountType,
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
      activeAccountType,
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

/** @deprecated Use activeAccountType from useNotifications */
export function useNotificationsActiveRoleContext(): NotificationAccountType {
  return useNotifications().activeAccountType
}
