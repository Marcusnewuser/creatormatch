import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Search, Shield } from 'lucide-react'
import { Sidebar } from '../components/layout/Sidebar'
import { Logo } from '../components/Logo'
import { UserMenu } from '../components/layout/UserMenu'
import { NotificationBell } from '../components/layout/NotificationBell'
import { adminNavItems } from '../config/navigation'
import { cn } from '../lib/utils'

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isSearch = location.pathname === '/admin/search'

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar
        items={adminNavItems}
        footer={
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Shield className="h-4 w-4 text-brand-primary" />
            Admin only
          </div>
        }
      />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <Link to="/admin/dashboard" className="lg:hidden shrink-0">
            <Logo size="sm" />
          </Link>
          <form
            className="flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault()
              const q = new FormData(e.currentTarget).get('q')?.toString().trim()
              if (q) navigate(`/admin/search?q=${encodeURIComponent(q)}`)
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                name="q"
                type="search"
                defaultValue={new URLSearchParams(location.search).get('q') ?? ''}
                placeholder="Search users, creators, brands, campaigns..."
                className={cn(
                  'w-full rounded-xl border border-border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20',
                  isSearch && 'border-brand-primary',
                )}
              />
            </div>
          </form>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
