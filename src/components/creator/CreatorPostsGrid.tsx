import { Link } from 'react-router-dom'
import { Eye, Heart } from 'lucide-react'
import { formatPostMetric } from '../../lib/creator-posts'
import type { CreatorPost } from '../../types/database'
import { cn } from '../../lib/utils'

interface CreatorPostsGridProps {
  posts: CreatorPost[]
  /** Base path for post links, default /posts */
  postLinkPrefix?: string
  className?: string
}

export function CreatorPostsGrid({
  posts,
  postLinkPrefix = '/posts',
  className,
}: CreatorPostsGridProps) {
  if (!posts.length) {
    return (
      <p className="text-sm text-text-secondary text-center py-10">
        No portfolio posts yet.
      </p>
    )
  }

  return (
    <div className={cn('grid grid-cols-3 gap-1 sm:gap-2', className)}>
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`${postLinkPrefix}/${post.id}`}
          className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 border border-border"
        >
          {post.thumbnail_url ? (
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-text-secondary">
              {post.title}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 pt-6">
            <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs text-white font-medium">
              <span className="flex items-center gap-0.5">
                <Heart className="h-3 w-3 fill-white/90" />
                {formatPostMetric(post.likes_count)}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {formatPostMetric(post.views_count)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
