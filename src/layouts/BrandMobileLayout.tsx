import { Outlet } from 'react-router-dom'
import { BrandMobileNav } from '../components/layout/BrandMobileNav'
import { useSyncRouteMode } from '../hooks/useSyncRouteMode'

export function BrandMobileLayout() {
  useSyncRouteMode('brand')
  return (
    <div className="min-h-screen bg-gray-50/50">
      <main className="mx-auto max-w-lg pb-24">
        <Outlet />
      </main>
      <BrandMobileNav />
    </div>
  )
}
