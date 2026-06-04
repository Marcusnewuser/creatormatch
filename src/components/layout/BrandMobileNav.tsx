import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Megaphone, MessageCircle, Building2 } from 'lucide-react'
import { useMessages } from '../../contexts/MessagesContext'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/brand/home', icon: LayoutDashboard, label: 'Home' },
  { to: '/brand/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/brand/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/brand/profile', icon: Building2, label: 'Profile' },
]

export function BrandMobileNav() {
  const location = useLocation()
  const { unreadCount } = useMessages()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-safe pt-2">
          {navItems.map(({ to, icon: Icon, label }) => {
          const active =
            location.pathname.startsWith(to) ||
            (to.includes('messages') && location.pathname.includes('/messages'))
          const showBadge = to.includes('/messages') && unreadCount > 0
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-200 min-w-[64px]',
                active ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              {showBadge && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
