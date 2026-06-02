import { ModeSwitcher } from './ModeSwitcher'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { cn } from '../../lib/utils'

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white/95 backdrop-blur-md px-4 sm:px-6',
        className,
      )}
    >
      <ModeSwitcher />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
