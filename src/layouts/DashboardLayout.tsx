import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, type NavItem } from '../components/layout/Sidebar'
import { AppHeader } from '../components/layout/AppHeader'
import { useSyncRouteMode } from '../hooks/useSyncRouteMode'

interface DashboardLayoutProps {
  navItems: NavItem[]
}

export function DashboardLayout({ navItems }: DashboardLayoutProps) {
  const location = useLocation()
  const mode = location.pathname.startsWith('/brand') ? 'brand' : 'creator'
  useSyncRouteMode(mode)
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar items={navItems} />
      <div className="lg:pl-64">
        <AppHeader className="lg:px-8" />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
