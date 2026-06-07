import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, FileText, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { HomeWelcomeHeader } from '../../components/layout/HomeWelcomeHeader'
import { StatCard } from '../../components/ui/StatCard'
import { CampaignCard } from '../../components/CampaignCard'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { countApplicationsByStatus, fetchCreatorProfile, fetchRecentCampaigns } from '../../lib/api'
import type { CampaignWithBrand } from '../../types/database'
import type { CreatorProfile } from '../../types/database'

export default function CreatorHome() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [recommended, setRecommended] = useState<CampaignWithBrand[]>([])
  const [recent, setRecent] = useState<CampaignWithBrand[]>([])
  const [stats, setStats] = useState({ pending: 0, accepted: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchCreatorProfile(user.id),
      fetchRecentCampaigns(6),
      countApplicationsByStatus(user.id, 'creator'),
    ])
      .then(([creatorProfile, campaigns, appStats]) => {
        setProfile(creatorProfile)
        setRecommended(campaigns.slice(0, 3))
        setRecent(campaigns.slice(0, 5))
        setStats({ pending: appStats.pending, accepted: appStats.accepted })
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingState />

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Creator'

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <HomeWelcomeHeader
        avatar={
          <Avatar src={profile?.avatar_url ?? undefined} name={profile?.full_name ?? 'Creator'} size="md" />
        }
        greeting="Welcome back,"
        title={firstName}
      />

      <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-5 text-white shadow-elevated animate-slide-up">
        <p className="text-sm text-white/80">Your next opportunity awaits</p>
        <h2 className="mt-1 text-xl font-semibold">Get Discovered by Brands</h2>
        <p className="mt-2 text-sm text-white/70">Turn your content into income with premium campaigns.</p>
        <Link
          to="/creator/campaigns"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-white hover:underline"
        >
          Browse campaigns <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 animate-slide-up stagger-1">
        <StatCard label="Pending" value={stats.pending} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Accepted" value={stats.accepted} icon={<CheckCircle className="h-5 w-5" />} />
      </div>

      <div className="mt-8 animate-slide-up stagger-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recommended Campaigns</h2>
          <Link to="/creator/campaigns" className="text-sm font-medium text-brand-primary hover:text-brand-secondary">
            See all
          </Link>
        </div>
        {recommended.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">No active campaigns yet.</p>
        ) : (
          <div className="space-y-4">
            {recommended.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 animate-slide-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            Recent Campaigns
          </h2>
          <Link to="/creator/campaigns" className="text-sm font-medium text-brand-primary hover:text-brand-secondary">
            Browse all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-4">No recent campaigns.</p>
        ) : (
          <div className="space-y-4">
            {recent.map((campaign) => (
              <CampaignCard key={`recent-${campaign.id}`} campaign={campaign} />
            ))}
          </div>
        )}
      </div>

      <Link
        to="/creator/dashboard"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <TrendingUp className="h-4 w-4" />
        Open Desktop Dashboard
      </Link>
    </div>
  )
}
