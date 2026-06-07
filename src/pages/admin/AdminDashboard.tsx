import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Megaphone,
  FileText,
  MessageCircle,
  Handshake,
  CheckCircle2,
  UserCircle,
} from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card } from '../../components/ui/Card'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { fetchAdminDashboardStats, type AdminDashboardStats } from '../../lib/admin'

function trendLabel(pct: number): string {
  if (pct > 0) return `+${pct}% vs prior 30 days`
  if (pct < 0) return `${pct}% vs prior 30 days`
  return 'No change vs prior 30 days'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (error) return <div className="text-red-600 text-sm">{error}</div>
  if (!stats) return null

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Platform overview — admin access only"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<UserCircle className="h-5 w-5" />}
          trend={trendLabel(stats.growth.users)}
          trendUp={stats.growth.users >= 0}
        />
        <StatCard
          label="Total Creators"
          value={stats.totalCreators.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          trend={trendLabel(stats.growth.creators)}
          trendUp={stats.growth.creators >= 0}
        />
        <StatCard
          label="Total Brands"
          value={stats.totalBrands.toLocaleString()}
          icon={<Building2 className="h-5 w-5" />}
          trend={trendLabel(stats.growth.brands)}
          trendUp={stats.growth.brands >= 0}
        />
        <StatCard
          label="Total Campaigns"
          value={stats.totalCampaigns.toLocaleString()}
          icon={<Megaphone className="h-5 w-5" />}
          trend={trendLabel(stats.growth.campaigns)}
          trendUp={stats.growth.campaigns >= 0}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <StatCard
          label="Total Applications"
          value={stats.totalApplications.toLocaleString()}
          icon={<FileText className="h-5 w-5" />}
          trend={trendLabel(stats.growth.applications)}
          trendUp={stats.growth.applications >= 0}
        />
        <StatCard
          label="Active Collaborations"
          value={stats.activeCollaborations.toLocaleString()}
          icon={<Handshake className="h-5 w-5" />}
          trend={trendLabel(stats.growth.collaborations)}
          trendUp={stats.growth.collaborations >= 0}
        />
        <StatCard
          label="Completed Collaborations"
          value={stats.completedCollaborations.toLocaleString()}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label="Messages Sent"
          value={stats.messagesSent.toLocaleString()}
          icon={<MessageCircle className="h-5 w-5" />}
          trend={trendLabel(stats.growth.messages)}
          trendUp={stats.growth.messages >= 0}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: '/admin/users', label: 'User Management', icon: Users },
          { to: '/admin/creators', label: 'Creator Management', icon: Users },
          { to: '/admin/brands', label: 'Brand Management', icon: Building2 },
          { to: '/admin/campaigns', label: 'Campaign Management', icon: Megaphone },
          { to: '/admin/applications', label: 'Applications', icon: FileText },
          { to: '/admin/collaborations', label: 'Collaborations', icon: Handshake },
          { to: '/admin/reports', label: 'Reports', icon: FileText },
          { to: '/admin/analytics', label: 'Analytics', icon: Megaphone },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card hover className="flex items-center gap-3 py-4 px-5 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-medium text-text-primary">{label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
