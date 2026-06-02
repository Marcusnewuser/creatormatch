import { CheckCircle2, Eye, FileText, Heart } from 'lucide-react'
import { formatPostMetric } from '../../lib/creator-posts'
import type { CreatorPostStats } from '../../types/database'
import { cn } from '../../lib/utils'

interface CreatorPostStatsBarProps {
  stats: CreatorPostStats
  className?: string
}

export function CreatorPostStatsBar({ stats, className }: CreatorPostStatsBarProps) {
  const items = [
    { icon: FileText, label: 'Posts', value: formatPostMetric(stats.totalPosts) },
    { icon: Eye, label: 'Views', value: formatPostMetric(stats.totalViews) },
    { icon: Heart, label: 'Likes', value: formatPostMetric(stats.totalLikes) },
    {
      icon: CheckCircle2,
      label: 'Completed Collaborations',
      value: formatPostMetric(stats.completedCollaborations),
    },
  ]

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3', className)}>
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-white px-3 py-3 text-center shadow-soft"
        >
          <Icon className="mx-auto h-4 w-4 text-brand-primary mb-1" />
          <p className="text-base sm:text-lg font-semibold text-text-primary">{value}</p>
          <p className="text-xs text-text-secondary leading-tight">{label}</p>
        </div>
      ))}
    </div>
  )
}
