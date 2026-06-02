import type { AppMode, UserRole } from '../types/database'

type PathRole = AppMode | UserRole | null | undefined

export function getProfilePath(role: PathRole): string {
  switch (role) {
    case 'creator':
      return '/creator/profile'
    case 'brand':
      return '/brand/profile'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/login'
  }
}

export function getSettingsPath(role: PathRole): string {
  switch (role) {
    case 'creator':
      return '/creator/settings'
    case 'brand':
      return '/brand/settings'
    case 'admin':
      return '/admin/settings'
    default:
      return '/login'
  }
}

export function getNotificationsPath(
  _role?: PathRole,
  _hasCreatorProfile?: boolean,
  _hasBrandProfile?: boolean,
): string {
  return '/notifications'
}

export function getProfileCreatePath(mode: AppMode): string {
  return mode === 'creator' ? '/creator/profile/create' : '/brand/profile/create'
}
