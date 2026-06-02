import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/layout/AppHeader'

export function ProfileLayout() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <AppHeader />
      <main className="mx-auto max-w-lg pb-8">
        <Outlet />
      </main>
    </div>
  )
}
