import type { UserRole } from '../types/database'

export const CAMPAIGN_CATEGORIES = [
  'Fashion',
  'Tech',
  'Food',
  'Travel',
  'Beauty',
  'Fitness',
  'Gaming',
] as const

export const CAMPAIGN_CATEGORIES_WITH_ALL = ['All', ...CAMPAIGN_CATEGORIES] as const

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'creator':
      return '/creator/home'
    case 'brand':
      return '/brand/home'
    case 'admin':
      return '/admin/dashboard'
  }
}

/** @deprecated Use getModeHomePath from account-mode */
export { getModeHomePath } from './account-mode'

export function formatFollowers(count: number | null | undefined): string {
  if (count == null || count === 0) return '0'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export const DEFAULT_CAMPAIGN_IMAGE =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'

export const DEFAULT_AVATAR = null
