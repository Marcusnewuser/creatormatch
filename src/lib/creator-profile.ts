import type { CreatorProfile } from '../types/database'

/** Strip @ prefix and lowercase; returns null if empty. */
export function normalizeUsernameInput(raw: string): string | null {
  const value = raw.trim().replace(/^@+/, '').toLowerCase()
  return value.length > 0 ? value : null
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/.test(username)
}

export type CreatorSocialPlatform = 'Instagram' | 'TikTok' | 'Xiaohongshu' | 'YouTube'

export interface CreatorSocialLink {
  platform: CreatorSocialPlatform
  url: string
}

export function getCreatorSocialLinks(
  profile: Pick<
    CreatorProfile,
    'instagram_url' | 'tiktok_url' | 'xiaohongshu_url' | 'youtube_url'
  >,
): CreatorSocialLink[] {
  const links: (CreatorSocialLink | null)[] = [
    profile.instagram_url ? { platform: 'Instagram', url: profile.instagram_url } : null,
    profile.tiktok_url ? { platform: 'TikTok', url: profile.tiktok_url } : null,
    profile.xiaohongshu_url ? { platform: 'Xiaohongshu', url: profile.xiaohongshu_url } : null,
    profile.youtube_url ? { platform: 'YouTube', url: profile.youtube_url } : null,
  ]
  return links.filter(Boolean) as CreatorSocialLink[]
}

/** Remove self-reported engagement stats — only verified integrations may set these. */
export function stripSelfReportedProfileStats<T extends Record<string, unknown>>(updates: T): T {
  const {
    follower_count: _followers,
    average_views: _views,
    average_likes: _likes,
    engagement_rate: _engagement,
    ...rest
  } = updates as T & {
    follower_count?: unknown
    average_views?: unknown
    average_likes?: unknown
    engagement_rate?: unknown
  }
  return rest as T
}
