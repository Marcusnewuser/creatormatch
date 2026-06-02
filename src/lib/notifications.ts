import { requireSupabase } from './supabase'
import type {
  Notification,
  NotificationRoleContext,
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
    case 'review_requested':
      return 'Review'
    case 'campaign_expiring':
      return 'Expiring'
    case 'campaign_closed':
      return 'Closed'
  }
}

export function getNotificationLink(type: NotificationType): string {
  switch (type) {
    case 'application_received':
    case 'application_withdrawn':
    case 'collaboration_confirmed':
    case 'review_requested':
      return '/brand/campaigns'
    case 'application_submitted':
    case 'application_accepted':
    case 'application_rejected':
    case 'collaboration_marked_complete':
      return '/creator/applications'
    case 'campaign_recommended':
      return '/creator/campaigns'
    case 'profile_viewed':
      return '/creator/profile'
    case 'campaign_expiring':
    case 'campaign_closed':
      return '/brand/campaigns'
  }
}

export async function fetchNotifications(
  userId: string,
  roleContext: NotificationRoleContext,
  limit = 50,
): Promise<Notification[]> {
  const { data, error } = await requireSupabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('role_context', roleContext)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function fetchUnreadNotificationCount(
  userId: string,
  roleContext: NotificationRoleContext,
): Promise<number> {
  const { count, error } = await requireSupabase()
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role_context', roleContext)
    .eq('is_read', false)
  if (error) throw error
  return count ?? 0
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
  roleContext: NotificationRoleContext,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('role_context', roleContext)
    .eq('is_read', false)
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
