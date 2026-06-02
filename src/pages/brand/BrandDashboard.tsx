import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Plus, Clock } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CampaignBudget } from '../../components/CampaignBudget'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import {
  countCampaignApplicants,
  fetchBrandApplicationStats,
  fetchBrandCampaigns,
  fetchRecentApplicantsForBrand,
  statusLabel,
} from '../../lib/api'
import { formatDate, formatFollowers } from '../../lib/constants'
import type { CampaignWithBrand } from '../../types/database'

export default function BrandDashboard() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([])
  const [applicants, setApplicants] = useState<Awaited<ReturnType<typeof fetchRecentApplicantsForBrand>>>([])
  const [appStats, setAppStats] = useState({ total: 0, pending: 0, accepted: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchBrandCampaigns(user.id),
      fetchRecentApplicantsForBrand(user.id),
      fetchBrandApplicationStats(user.id),
    ])
      .then(([brandCampaigns, recentApplicants, stats]) => {
        setCampaigns(brandCampaigns)
        setApplicants(recentApplicants)
        setAppStats({ total: stats.total, pending: stats.pending, accepted: stats.accepted })
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingState />

  const activeCampaigns = campaigns.filter((c) => c.status === 'active')

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your campaigns and applicants</p>
        </div>
        <Link to="/brand/campaigns/create">
          <Button>
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Total Applicants" value={appStats.total} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Pending Review" value={appStats.pending} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Accepted Creators" value={appStats.accepted} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Applicants</h2>
          <Card padding="none">
            {applicants.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-secondary">No applicants yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {applicants.map((applicant) => (
                  <Link
                    key={applicant.id}
                    to={`/brand/applicants/${applicant.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar
                      src={applicant.creator_profiles?.avatar_url ?? undefined}
                      name={applicant.creator_profiles?.full_name ?? 'Creator'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {applicant.creator_profiles?.full_name ?? 'Creator'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {applicant.creator_profiles?.category ?? 'Creator'} ·{' '}
                        {formatFollowers(applicant.creator_profiles?.follower_count)}
                      </p>
                    </div>
                    <span className="text-xs text-text-secondary">{formatDate(applicant.created_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Active Campaigns</h2>
            <Link to="/brand/campaigns" className="text-sm font-medium text-brand-primary">
              View all
            </Link>
          </div>
          {activeCampaigns.length === 0 ? (
            <p className="text-sm text-text-secondary">No active campaigns.</p>
          ) : (
            <ActiveCampaignList campaigns={activeCampaigns} />
          )}
        </div>
      </div>
    </div>
  )
}

function ActiveCampaignList({ campaigns }: { campaigns: CampaignWithBrand[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all(campaigns.map((c) => countCampaignApplicants(c.id))).then((results) => {
      const map: Record<string, number> = {}
      campaigns.forEach((c, i) => {
        map[c.id] = results[i]
      })
      setCounts(map)
    })
  }, [campaigns])

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <Link key={campaign.id} to={`/brand/campaigns/${campaign.id}/applicants`}>
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{campaign.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {counts[campaign.id] ?? 0} applicants
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
                  {campaign.platform ? ` · ${campaign.platform}` : ''}
                </p>
              </div>
              <Badge variant="success">{statusLabel(campaign.status)}</Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
