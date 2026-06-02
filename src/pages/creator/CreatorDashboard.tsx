import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, TrendingUp, Clock, XCircle } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { CampaignCard } from '../../components/CampaignCard'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import {
  countApplicationsByStatus,
  fetchCreatorProfile,
  fetchRecentActivity,
  fetchRecentCampaigns,
} from '../../lib/api'
import { formatFollowers, formatRelativeTime } from '../../lib/constants'
import type { CampaignWithBrand } from '../../types/database'
import type { CreatorProfile } from '../../types/database'

export default function CreatorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [recommended, setRecommended] = useState<CampaignWithBrand[]>([])
  const [recent, setRecent] = useState<CampaignWithBrand[]>([])
  const [activity, setActivity] = useState<{ id: string; text: string; time: string }[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchCreatorProfile(user.id),
      fetchRecentCampaigns(8),
      fetchRecentActivity(5),
      countApplicationsByStatus(user.id, 'creator'),
    ])
      .then(([creatorProfile, campaigns, recentActivity, appStats]) => {
        setProfile(creatorProfile)
        setRecommended(campaigns.slice(0, 4))
        setRecent(campaigns.slice(0, 6))
        setActivity(recentActivity)
        setStats({
          total: appStats.total,
          pending: appStats.pending,
          accepted: appStats.accepted,
          rejected: appStats.rejected,
        })
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingState />

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Creator'

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here&apos;s what&apos;s happening with your creator profile
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Total Applications" value={stats.total} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Accepted" value={stats.accepted} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Recommended Opportunities</h2>
              <Link to="/creator/campaigns" className="text-sm font-medium text-brand-primary hover:text-brand-secondary">
                View all
              </Link>
            </div>
            {recommended.length === 0 ? (
              <p className="text-sm text-text-secondary">No active campaigns available.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recommended.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Recent Campaigns</h2>
              <Link to="/creator/campaigns" className="text-sm font-medium text-brand-primary hover:text-brand-secondary">
                Browse all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-text-secondary">No recent campaigns.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recent.map((campaign) => (
                  <CampaignCard key={`recent-${campaign.id}`} campaign={campaign} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Activity Overview</h2>
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

          <Card className="mt-4">
            <div className="flex items-center gap-3">
              <Avatar src={profile?.avatar_url ?? undefined} name={profile?.full_name ?? 'Creator'} size="md" />
              <div>
                <p className="text-sm font-medium text-text-primary">{profile?.full_name ?? 'Creator'}</p>
                <p className="text-xs text-text-secondary">{formatFollowers(profile?.follower_count)} followers</p>
              </div>
            </div>
            <Link
              to="/creator/applications"
              className="mt-3 block text-center text-sm font-medium text-brand-primary hover:text-brand-secondary"
            >
              View Applications
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
