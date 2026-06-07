import type { ReactNode } from 'react'
import { NotificationBellLink } from './NotificationBellLink'
import { cn } from '../../lib/utils'

interface HomeWelcomeHeaderProps {
  avatar: ReactNode
  greeting: string
  title: string
  className?: string
}

export function HomeWelcomeHeader({ avatar, greeting, title, className }: HomeWelcomeHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-6', className)}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {avatar}
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">{greeting}</p>
          <h1 className="text-lg font-semibold text-text-primary truncate">{title}</h1>
        </div>
      </div>
      <NotificationBellLink />
    </div>
  )
}
