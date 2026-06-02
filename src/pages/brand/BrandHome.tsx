import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Megaphone, TrendingUp } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { StatCard } from '../../components/ui/StatCard'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CampaignBudget } from '../../components/CampaignBudget'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import {
  countCampaignApplicants,
  fetchBrandCampaignStats,
  fetchBrandCampaigns,
  fetchBrandProfile,
  statusLabel,
} from '../../lib/api'
import type { BrandProfile, CampaignWithBrand } from '../../types/database'

export default function BrandHome() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([])
  const [campaignStats, setCampaignStats] = useState({ total: 0, active: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchBrandProfile(user.id),
      fetchBrandCampaigns(user.id),
      fetchBrandCampaignStats(user.id),
    ])
      .then(([brandProfile, brandCampaigns, stats]) => {
        setProfile(brandProfile)
        setCampaigns(brandCampaigns.slice(0, 3))
        setCampaignStats({ total: stats.total, active: stats.active })
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  const firstCampaignId = campaigns[0]?.id

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {profile?.logo_url ? (
            <img src={profile.logo_url} alt={profile.company_name ?? 'Brand'} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <Avatar name={profile?.company_name ?? 'Brand'} size="md" />
          )}
          <div>
            <p className="text-sm text-text-secondary">Brand Dashboard</p>
            <h1 className="text-lg font-semibold text-text-primary">{profile?.company_name ?? 'Your Brand'}</h1>
          </div>
        </div>
        <Link to="/brand/profile">
          <Avatar src={profile?.logo_url ?? undefined} name={profile?.company_name ?? 'Brand'} size="md" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-slide-up">
        <StatCard label="Total Campaigns" value={campaignStats.total} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Active Campaigns" value={campaignStats.active} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      <div className="mt-6 animate-slide-up stagger-1">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/brand/campaigns/create">
            <Card hover className="flex flex-col items-center text-center py-5 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary mb-2">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-text-primary">Create Campaign</p>
            </Card>
          </Link>
          {firstCampaignId && (
            <Link to={`/brand/campaigns/${firstCampaignId}/applicants`}>
              <Card hover className="flex flex-col items-center text-center py-5 cursor-pointer">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary mb-2">
                  <Users className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary">View Applicants</p>
              </Card>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 animate-slide-up stagger-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recent Campaigns</h2>
          <Link to="/brand/campaigns" className="text-sm font-medium text-brand-primary">See all</Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-6">No campaigns yet. Create your first one!</p>
        ) : (
          <CampaignList campaigns={campaigns} />
        )}
      </div>

      <Link
        to="/brand/dashboard"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <TrendingUp className="h-4 w-4" />
        Open Desktop Dashboard
      </Link>
    </div>
  )
}

function CampaignList({ campaigns }: { campaigns: CampaignWithBrand[] }) {
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all(campaigns.map((c) => countCampaignApplicants(c.id))).then((counts) => {
      const map: Record<string, number> = {}
      campaigns.forEach((c, i) => {
        map[c.id] = counts[i]
      })
      setApplicantCounts(map)
    })
  }, [campaigns])

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <Link key={campaign.id} to={`/brand/campaigns/${campaign.id}/edit`}>
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{campaign.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {applicantCounts[campaign.id] ?? 0} applicants
                  {campaign.budget ? (
                    <>
                      {' · '}
                      <CampaignBudget
                        budget={campaign.budget}
                        currency={campaign.currency}
                        showIcon={false}
                        className="inline"
                      />
                    </>
                  ) : (
                    ' · TBD'
                  )}
                </p>
              </div>
              <Badge variant={campaign.status === 'active' ? 'success' : 'outline'}>
                {statusLabel(campaign.status)}
              </Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
