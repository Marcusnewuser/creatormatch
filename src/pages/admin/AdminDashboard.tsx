import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Building2, Megaphone, FileText, BarChart3, TrendingUp } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card } from '../../components/ui/Card'
import { LoadingState } from '../../components/ui/LoadingState'
import { fetchAdminStats, fetchRecentActivity } from '../../lib/api'
import { formatRelativeTime } from '../../lib/constants'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ creators: 0, brands: 0, campaigns: 0, applications: 0 })
  const [activity, setActivity] = useState<{ id: string; text: string; time: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchRecentActivity(5)])
      .then(([adminStats, recentActivity]) => {
        setStats(adminStats)
        setActivity(recentActivity)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load admin data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <div className="text-red-600 text-sm">{error}</div>

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Platform overview and management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Total Creators" value={stats.creators.toLocaleString()} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Total Brands" value={stats.brands.toLocaleString()} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Total Campaigns" value={stats.campaigns.toLocaleString()} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Total Applications" value={stats.applications.toLocaleString()} icon={<FileText className="h-5 w-5" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Platform Overview</h2>
          <Card className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-brand-primary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                {stats.creators + stats.brands} total users · {stats.applications} applications submitted
              </p>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
          <Card padding="none">
            {activity.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-secondary">No recent activity.</p>
            ) : (
              <div className="divide-y divide-border">
                {activity.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="text-sm text-text-primary">{item.text}</p>
                    <p className="text-xs text-text-secondary mt-1">{formatRelativeTime(item.time)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="mt-4 bg-brand-light border-brand-primary/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Platform Health</p>
                <p className="text-xs text-text-secondary">All systems operational</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link to="/admin/creators">
          <Card hover className="text-center py-6 cursor-pointer">
            <Users className="h-8 w-8 text-brand-primary mx-auto mb-2" />
            <p className="font-medium text-text-primary">Manage Creators</p>
          </Card>
        </Link>
        <Link to="/admin/brands">
          <Card hover className="text-center py-6 cursor-pointer">
            <Building2 className="h-8 w-8 text-brand-primary mx-auto mb-2" />
            <p className="font-medium text-text-primary">Manage Brands</p>
          </Card>
        </Link>
        <Link to="/admin/reports">
          <Card hover className="text-center py-6 cursor-pointer">
            <BarChart3 className="h-8 w-8 text-brand-primary mx-auto mb-2" />
            <p className="font-medium text-text-primary">View Reports</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
