import { Outlet } from 'react-router-dom'
import { MobileNav } from '../components/layout/MobileNav'
import { useSyncRouteMode } from '../hooks/useSyncRouteMode'

export function MobileLayout() {
  useSyncRouteMode('creator')
  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="mx-auto max-w-lg pb-24">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
