import { Link, useLocation } from 'react-router-dom'
import { type LucideIcon } from 'lucide-react'
import { Logo } from '../Logo'
import { cn } from '../../lib/utils'

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

interface SidebarProps {
  items: NavItem[]
  footer?: React.ReactNode
}

export function Sidebar({ items, footer }: SidebarProps) {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-border bg-white">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link to="/">
          <Logo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-light text-brand-primary'
                  : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {footer && <div className="p-4 border-t border-border">{footer}</div>}
    </aside>
  )
}
