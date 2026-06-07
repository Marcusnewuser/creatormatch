import type { Notification, NotificationAccountType, NotificationType } from '../types/database'

/** Notification types that belong to the Creator workspace. */
export const CREATOR_NOTIFICATION_TYPES = new Set<NotificationType>([
  'application_submitted',
  'application_accepted',
  'application_rejected',
  'profile_viewed',
  'campaign_recommended',
  'collaboration_marked_complete',
  'collaboration_invitation',
  'new_message',
  'submission_approved',
  'file_request',
])

/** Notification types that belong to the Brand workspace. */
export const BRAND_NOTIFICATION_TYPES = new Set<NotificationType>([
  'application_received',
  'application_withdrawn',
  'campaign_expiring',
  'campaign_closed',
  'collaboration_confirmed',
  'collaboration_invitation',
  'review_requested',
  'content_submitted',
  'new_message',
  'file_request',
])

export function expectedAccountTypeForNotification(
  type: NotificationType,
): NotificationAccountType | 'admin' {
  if (type.startsWith('admin_')) return 'admin'
  if (CREATOR_NOTIFICATION_TYPES.has(type) && !BRAND_NOTIFICATION_TYPES.has(type)) return 'creator'
  if (BRAND_NOTIFICATION_TYPES.has(type) && !CREATOR_NOTIFICATION_TYPES.has(type)) return 'brand'
  return 'creator'
}

export function resolveNotificationAccountType(
  row: Pick<Notification, 'account_type' | 'type'>,
): NotificationAccountType {
  if (row.account_type) return row.account_type
  return expectedAccountTypeForNotification(row.type) as NotificationAccountType
}

export function matchesNotificationAccountType(
  notification: Notification,
  accountType: NotificationAccountType,
): boolean {
  return resolveNotificationAccountType(notification) === accountType
}

/** Keep only notifications for the active workspace (defense in depth). */
export function filterNotificationsForAccount(
  items: Notification[],
  accountType: NotificationAccountType,
): Notification[] {
  return items.filter((n) => matchesNotificationAccountType(n, accountType))
}

export function normalizeNotificationRow(row: Record<string, unknown>): Notification {
  const type = row.type as NotificationType
  const accountType = (row.account_type ?? row.role_context ?? null) as Notification['account_type'] | null

  const notification: Notification = {
    id: row.id as string,
    user_id: row.user_id as string,
    account_type: accountType ?? (expectedAccountTypeForNotification(type) as NotificationAccountType),
    title: row.title as string,
    message: row.message as string,
    type,
    is_read: row.is_read as boolean,
    created_at: row.created_at as string,
  }

  return notification
}
