import { Link } from 'react-router-dom'
import {
  Bell,
  Briefcase,
  CheckCheck,
  Clock,
  Eye,
  Megaphone,
  MessageSquareWarning,
  Send,
  UserCheck,
  UserMinus,
  UserX,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { formatRelativeTime } from '../lib/constants'
import { getNotificationLink } from '../lib/notifications'
import { cn } from '../lib/utils'
import type { Notification, NotificationType } from '../types/database'

function NotificationIcon({ type }: { type: NotificationType }) {
  const className = 'h-5 w-5 shrink-0'
  switch (type) {
    case 'application_submitted':
      return <Send className={cn(className, 'text-brand-primary')} />
    case 'application_received':
      return <UserCheck className={cn(className, 'text-brand-primary')} />
    case 'application_accepted':
      return <CheckCheck className={cn(className, 'text-green-600')} />
    case 'application_rejected':
      return <UserX className={cn(className, 'text-text-secondary')} />
    case 'application_withdrawn':
      return <UserMinus className={cn(className, 'text-text-secondary')} />
    case 'profile_viewed':
      return <Eye className={cn(className, 'text-brand-primary')} />
    case 'campaign_recommended':
      return <Megaphone className={cn(className, 'text-brand-primary')} />
    case 'collaboration_marked_complete':
      return <CheckCheck className={cn(className, 'text-green-600')} />
    case 'collaboration_confirmed':
      return <CheckCheck className={cn(className, 'text-green-600')} />
    case 'review_requested':
      return <MessageSquareWarning className={cn(className, 'text-amber-600')} />
    case 'campaign_expiring':
      return <Clock className={cn(className, 'text-amber-600')} />
    case 'campaign_closed':
      return <XCircle className={cn(className, 'text-text-secondary')} />
    default:
      return <Briefcase className={cn(className, 'text-brand-primary')} />
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  return (
    <Link
      to={getNotificationLink(notification.type)}
      onClick={() => {
        if (!notification.is_read) onRead(notification.id)
      }}
      className={cn(
        'flex gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:border-brand-primary/30',
        !notification.is_read && 'border-brand-primary/20 bg-brand-light/30',
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border shrink-0">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
          {!notification.is_read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-text-secondary leading-relaxed">{notification.message}</p>
        <p className="mt-2 text-xs text-text-secondary">{formatRelativeTime(notification.created_at)}</p>
      </div>
    </Link>
  )
}

function RoleUnreadSummary({
  creatorUnreadCount,
  brandUnreadCount,
  activeRoleContext,
}: {
  creatorUnreadCount: number
  brandUnreadCount: number
  activeRoleContext: 'creator' | 'brand'
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div
        className={cn(
          'rounded-xl border bg-white px-4 py-3',
          activeRoleContext === 'creator' ? 'border-brand-primary/30 bg-brand-light/20' : 'border-border',
        )}
      >
        <p className="text-xs text-text-secondary">Creator</p>
        <p className="mt-1 text-lg font-semibold text-text-primary">{creatorUnreadCount}</p>
        <p className="text-xs text-text-secondary">unread</p>
      </div>
      <div
        className={cn(
          'rounded-xl border bg-white px-4 py-3',
          activeRoleContext === 'brand' ? 'border-brand-primary/30 bg-brand-light/20' : 'border-border',
        )}
      >
        <p className="text-xs text-text-secondary">Brand</p>
        <p className="mt-1 text-lg font-semibold text-text-primary">{brandUnreadCount}</p>
        <p className="text-xs text-text-secondary">unread</p>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { hasCreatorProfile, hasBrandProfile } = useAuth()
  const {
    notifications,
    unreadCount,
    creatorUnreadCount,
    brandUnreadCount,
    activeRoleContext,
    loading,
    ready,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const modeLabel = activeRoleContext === 'brand' ? 'Brand' : 'Creator'
  const dualRole = hasCreatorProfile && hasBrandProfile

  if (!ready) {
    return (
      <div className="px-4 pt-6 pb-8">
        <PageHeader title="Notifications" back />
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migrations <code className="text-xs">010_notifications.sql</code> and{' '}
          <code className="text-xs">011_notification_role_context.sql</code> in Supabase to enable
          notifications.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <LoadingState />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${modeLabel} · ${unreadCount} unread`
            : `${modeLabel} · All caught up`
        }
        back
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead().catch(() => undefined)}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {dualRole && (
        <RoleUnreadSummary
          creatorUnreadCount={creatorUnreadCount}
          brandUnreadCount={brandUnreadCount}
          activeRoleContext={activeRoleContext}
        />
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={`No ${modeLabel.toLowerCase()} notifications`}
          description={
            activeRoleContext === 'creator'
              ? 'Application updates, profile views, and campaign recommendations appear here.'
              : 'Application updates and campaign alerts for your brand appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={(id) => markAsRead(id).catch(() => undefined)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
