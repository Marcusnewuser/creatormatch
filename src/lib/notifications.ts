import { requireSupabase } from './supabase'
import {
  filterNotificationsForAccount,
  matchesNotificationAccountType,
  normalizeNotificationRow,
} from './notification-account'
import type {
  Notification,
  NotificationAccountType,
  NotificationType,
} from '../types/database'

export interface RoleUnreadCounts {
  creator: number
  brand: number
}

export function notificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case 'application_submitted':
      return 'Submitted'
    case 'application_received':
      return 'Application'
    case 'application_accepted':
      return 'Accepted'
    case 'application_rejected':
      return 'Update'
    case 'application_withdrawn':
      return 'Withdrawn'
    case 'profile_viewed':
      return 'Profile'
    case 'campaign_recommended':
      return 'Recommended'
    case 'collaboration_marked_complete':
      return 'Completion'
    case 'collaboration_confirmed':
      return 'Confirmed'
    case 'collaboration_invitation':
      return 'Invitation'
    case 'review_requested':
      return 'Review'
    case 'campaign_expiring':
      return 'Expiring'
    case 'campaign_closed':
      return 'Closed'
    case 'new_message':
      return 'Message'
    case 'file_request':
      return 'File'
    case 'content_submitted':
      return 'Content'
    case 'submission_approved':
      return 'Approved'
    case 'admin_user_registered':
      return 'New User'
    case 'admin_campaign_created':
      return 'New Campaign'
    case 'admin_report_submitted':
      return 'Report'
  }
}

export function getNotificationLink(type: NotificationType): string {
  switch (type) {
    case 'application_received':
    case 'application_withdrawn':
    case 'collaboration_confirmed':
    case 'review_requested':
    case 'content_submitted':
      return '/brand/campaigns'
    case 'application_submitted':
    case 'application_accepted':
    case 'application_rejected':
    case 'collaboration_marked_complete':
    case 'collaboration_invitation':
    case 'submission_approved':
      return '/creator/applications'
    case 'new_message':
    case 'file_request':
      return '/messages'
    case 'campaign_recommended':
      return '/creator/campaigns'
    case 'profile_viewed':
      return '/creator/profile'
    case 'campaign_expiring':
    case 'campaign_closed':
      return '/brand/campaigns'
    case 'admin_user_registered':
      return '/admin/users'
    case 'admin_campaign_created':
      return '/admin/campaigns'
    case 'admin_report_submitted':
      return '/admin/reports'
  }
}

/** Fetch user notifications and filter by workspace in-app (avoids DB column name mismatches). */
async function fetchUserNotifications(userId: string, limit = 100): Promise<Notification[]> {
  const { data, error } = await requireSupabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => normalizeNotificationRow(row as Record<string, unknown>))
}

export async function fetchNotifications(
  userId: string,
  accountType: NotificationAccountType,
  limit = 50,
): Promise<Notification[]> {
  const rows = await fetchUserNotifications(userId, Math.max(limit * 3, 100))
  return filterNotificationsForAccount(rows, accountType).slice(0, limit)
}

export async function fetchUnreadNotificationCount(
  userId: string,
  accountType: NotificationAccountType,
): Promise<number> {
  const { data, error } = await requireSupabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .limit(200)

  if (error) throw error

  return (data ?? [])
    .map((row) => normalizeNotificationRow(row as Record<string, unknown>))
    .filter((n) => matchesNotificationAccountType(n, accountType)).length
}

export async function fetchUnreadCountsByRole(userId: string): Promise<RoleUnreadCounts> {
  const [creator, brand] = await Promise.all([
    fetchUnreadNotificationCount(userId, 'creator'),
    fetchUnreadNotificationCount(userId, 'brand'),
  ])
  return { creator, brand }
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function markAllNotificationsRead(
  userId: string,
  accountType: NotificationAccountType,
): Promise<void> {
  const unread = await fetchNotifications(userId, accountType, 200)
  const unreadIds = unread.filter((n) => !n.is_read).map((n) => n.id)
  if (unreadIds.length === 0) return

  const { error } = await requireSupabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .in('id', unreadIds)

  if (error) throw error
}

export async function recordCreatorProfileView(creatorId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('record_creator_profile_view', {
    p_creator_id: creatorId,
  })
  if (error) throw error
}

export function subscribeToNotifications(
  userId: string,
  onChange: () => void,
): () => void {
  const client = requireSupabase()
  const channel = client
    .channel(`notifications:${userId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => onChange(),
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}
