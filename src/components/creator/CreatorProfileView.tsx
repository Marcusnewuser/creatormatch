import { ExternalLink } from 'lucide-react'
import { CreatorProfileHeader } from './CreatorProfileHeader'
import { CreatorPostStatsBar } from './CreatorPostStatsBar'
import { CreatorPostsGrid } from './CreatorPostsGrid'
import { getCreatorSocialLinks } from '../../lib/creator-profile'
import type { CreatorProfileWithPosts } from '../../types/database'
import { cn } from '../../lib/utils'

interface CreatorProfileViewProps {
  data: CreatorProfileWithPosts
  username?: string
  showLocation?: boolean
  className?: string
  headerAction?: React.ReactNode
  postsHeaderAction?: React.ReactNode
}

export function CreatorProfileView({
  data,
  username,
  showLocation = true,
  className,
  headerAction,
  postsHeaderAction,
}: CreatorProfileViewProps) {
  const { profile, posts, stats } = data
  const socials = getCreatorSocialLinks(profile)

  return (
    <div className={cn('animate-fade-in', className)}>
      {headerAction && <div className="flex justify-end mb-3">{headerAction}</div>}

      <CreatorProfileHeader profile={profile} showLocation={showLocation} username={username} />

      <CreatorPostStatsBar stats={stats} className="mt-4" />

      {socials.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Social Links</h2>
          <div className="space-y-2">
            {socials.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-white hover:border-brand-primary/30 transition-colors"
              >
                <p className="text-sm font-medium text-text-primary">{social.platform}</p>
                <ExternalLink className="h-4 w-4 text-text-secondary" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Portfolio</h2>
          {postsHeaderAction}
        </div>
        <CreatorPostsGrid posts={posts} />
      </div>
    </div>
  )
}
