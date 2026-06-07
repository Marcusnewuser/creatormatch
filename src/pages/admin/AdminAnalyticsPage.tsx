import { useEffect, useState } from 'react'
import { StatCard } from '../../components/ui/StatCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminGrowthChart } from '../../components/admin/AdminGrowthChart'
import { fetchAdminAnalytics, type AdminAnalytics } from '../../lib/admin'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminAnalytics()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (!data) return null

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Analytics" subtitle="Platform growth and activity metrics" />

      <h2 className="text-lg font-semibold text-text-primary mb-3">Today</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="New Users" value={data.today.users} />
        <StatCard label="New Campaigns" value={data.today.campaigns} />
        <StatCard label="New Applications" value={data.today.applications} />
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">Last 7 Days</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="New Users" value={data.last7Days.users} />
        <StatCard label="New Campaigns" value={data.last7Days.campaigns} />
        <StatCard label="New Applications" value={data.last7Days.applications} />
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-3">Last 30 Days</h2>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="New Users" value={data.last30Days.users} />
        <StatCard label="New Campaigns" value={data.last30Days.campaigns} />
        <StatCard label="New Applications" value={data.last30Days.applications} />
      </div>

      <h2 className="text-lg font-semibold text-text-primary mb-4">Growth Charts (7 days)</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminGrowthChart title="User Growth" data={data.charts.userGrowth} />
        <AdminGrowthChart title="Campaign Growth" data={data.charts.campaignGrowth} />
        <AdminGrowthChart title="Application Growth" data={data.charts.applicationGrowth} />
      </div>
    </div>
  )
}
