import { MapPin } from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { BrandProfile } from '../../types/database'
import { cn } from '../../lib/utils'

interface BrandProfileHeaderProps {
  profile: BrandProfile
  className?: string
  bannerAction?: React.ReactNode
  logoAction?: React.ReactNode
}

export function BrandProfileHeader({
  profile,
  className,
  bannerAction,
  logoAction,
}: BrandProfileHeaderProps) {
  const initial = profile.company_name?.[0]?.toUpperCase() ?? 'B'

  return (
    <div
      className={cn(
        '-mx-4 sm:mx-0 overflow-visible',
        'border-y border-border sm:border sm:rounded-2xl bg-white shadow-soft',
        className,
      )}
    >
      <div className="relative z-0 h-40 md:h-[220px] overflow-hidden sm:rounded-t-2xl bg-gradient-to-br from-brand-light to-brand-primary/20">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
        ) : null}
        {bannerAction && (
          <div className="absolute top-3 right-3 z-10">{bannerAction}</div>
        )}
      </div>

      <div className="relative z-10 bg-white px-4 sm:px-6 pb-6 sm:rounded-b-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          <div className="relative z-20 -mt-10 md:-mt-14 shrink-0 self-start">
            <div className="relative inline-flex rounded-2xl border-4 border-white bg-white shadow-soft">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={profile.company_name ?? 'Company logo'}
                  className="h-20 w-20 md:h-24 md:w-24 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-xl bg-brand-light text-xl md:text-2xl font-semibold text-brand-primary">
                  {initial}
                </div>
              )}
              {logoAction}
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:pb-1 pt-0 sm:pt-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight truncate">
              {profile.company_name ?? 'Brand'}
            </h1>
            {profile.industry && (
              <Badge variant="primary" className="mt-2">
                {profile.industry}
              </Badge>
            )}
            {profile.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0" />
                {profile.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
