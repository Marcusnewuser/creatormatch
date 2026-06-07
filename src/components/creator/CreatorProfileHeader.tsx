import { MapPin } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import type { CreatorProfile } from '../../types/database'
import { cn } from '../../lib/utils'

interface CreatorProfileHeaderProps {
  profile: CreatorProfile
  username?: string
  showLocation?: boolean
  className?: string
  /** Optional actions overlaid on banner (e.g. upload button in edit mode) */
  bannerAction?: React.ReactNode
  /** Optional action on avatar (e.g. camera button in edit mode) */
  avatarAction?: React.ReactNode
}

export function CreatorProfileHeader({
  profile,
  username,
  showLocation = true,
  className,
  bannerAction,
  avatarAction,
}: CreatorProfileHeaderProps) {
  return (
    <div
      className={cn(
        '-mx-4 sm:mx-0 overflow-visible',
        'border-y border-border sm:border sm:rounded-2xl bg-white shadow-soft',
        className,
      )}
    >
      {/* Banner — clip image only, not the avatar */}
      <div className="relative z-0 h-32 sm:h-40 md:h-44 overflow-hidden sm:rounded-t-2xl bg-gradient-to-br from-brand-light to-brand-primary/20">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        {bannerAction && (
          <div className="absolute top-3 right-3 z-10">{bannerAction}</div>
        )}
      </div>

      {/* Profile identity — sits above banner layer */}
      <div className="relative z-10 bg-white px-4 sm:px-6 pb-6 sm:rounded-b-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          {/* ~45% avatar overlap: xl = 5rem, -mt-10 = 2.5rem */}
          <div className="relative z-20 -mt-10 sm:-mt-12 md:-mt-14 shrink-0 self-start">
            <div className="relative inline-flex rounded-full border-4 border-white bg-white shadow-soft">
              <Avatar
                src={profile.avatar_url ?? undefined}
                name={profile.full_name ?? 'Creator'}
                size="profile"
                className="ring-0"
              />
              {avatarAction}
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:pb-1 pt-0 sm:pt-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight truncate">
              {profile.full_name ?? 'Creator'}
            </h1>
            {username && (
              <p className="text-sm text-text-secondary mt-0.5">@{username}</p>
            )}
            {profile.category && (
              <Badge variant="primary" className="mt-2">
                {profile.category}
              </Badge>
            )}
          </div>
        </div>

        {(profile.bio || (showLocation && profile.location)) && (
          <div className="mt-5 space-y-2">
            {profile.bio && (
              <p className="text-sm text-text-primary leading-relaxed">{profile.bio}</p>
            )}
            {showLocation && profile.location && (
              <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0" />
                {profile.location}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
