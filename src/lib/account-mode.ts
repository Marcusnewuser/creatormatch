import type { BrandProfile, CreatorProfile, Profile } from '../types/database'

export type AppMode = 'creator' | 'brand'

const STORAGE_KEY = 'creatormatch_active_mode'

export function readStoredActiveMode(): AppMode | null {
  const value = localStorage.getItem(STORAGE_KEY)
  if (value === 'creator' || value === 'brand') return value
  return null
}

export function writeStoredActiveMode(mode: AppMode) {
  localStorage.setItem(STORAGE_KEY, mode)
}

export function clearStoredActiveMode() {
  localStorage.removeItem(STORAGE_KEY)
}

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin'
}

export function getPrimaryMode(profile: Profile | null | undefined): AppMode | null {
  if (!profile) return null
  if (profile.primary_mode === 'creator' || profile.primary_mode === 'brand') {
    return profile.primary_mode
  }
  if (profile.role === 'creator' || profile.role === 'brand') {
    return profile.role
  }
  return null
}

export function needsOnboarding(
  profile: Profile | null | undefined,
  creatorProfile: CreatorProfile | null | undefined,
  brandProfile: BrandProfile | null | undefined,
): boolean {
  if (isAdmin(profile)) return false
  if (creatorProfile || brandProfile) return false
  if (getPrimaryMode(profile)) return false
  return true
}

export function resolveActiveMode(
  stored: AppMode | null,
  primaryMode: AppMode | null,
  hasCreator: boolean,
  hasBrand: boolean,
): AppMode | null {
  if (stored === 'creator' && hasCreator) return 'creator'
  if (stored === 'brand' && hasBrand) return 'brand'
  if (primaryMode === 'creator' && hasCreator) return 'creator'
  if (primaryMode === 'brand' && hasBrand) return 'brand'
  if (hasCreator) return 'creator'
  if (hasBrand) return 'brand'
  return primaryMode
}

export function getModeHomePath(mode: AppMode): string {
  return mode === 'creator' ? '/creator/home' : '/brand/home'
}

export function getDefaultHomePath(
  profile: Profile | null | undefined,
  creatorProfile: CreatorProfile | null | undefined,
  brandProfile: BrandProfile | null | undefined,
  activeMode: AppMode | null,
): string {
  if (isAdmin(profile)) return '/admin/dashboard'
  if (needsOnboarding(profile, creatorProfile, brandProfile)) return '/role'
  const mode =
    activeMode ??
    resolveActiveMode(
      readStoredActiveMode(),
      getPrimaryMode(profile),
      Boolean(creatorProfile),
      Boolean(brandProfile),
    ) ??
    'creator'
  return getModeHomePath(mode)
}
