import { Link } from 'react-router-dom'
import { CheckCircle2, Globe } from 'lucide-react'
import { BrandProfileHeader } from './BrandProfileHeader'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { CampaignBudget } from '../CampaignBudget'
import { statusLabel } from '../../lib/api'
import type { BrandProfile, Campaign } from '../../types/database'
import { cn } from '../../lib/utils'

interface BrandProfileViewProps {
  profile: BrandProfile
  campaigns: Campaign[]
  completedCollaborations?: number
  className?: string
  headerAction?: React.ReactNode
}

function CampaignList({ campaigns, emptyMessage }: { campaigns: Campaign[]; emptyMessage: string }) {
  if (!campaigns.length) {
    return <p className="text-sm text-text-secondary text-center py-6">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <Link key={campaign.id} to={`/brand/campaigns/${campaign.id}/edit`}>
          <Card hover>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-text-primary truncate">{campaign.title}</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {campaign.category}
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
                  ) : null}
                </p>
              </div>
              <Badge variant={campaign.status === 'active' ? 'success' : 'outline'} className="shrink-0">
                {statusLabel(campaign.status)}
              </Badge>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function BrandProfileView({
  profile,
  campaigns,
  completedCollaborations = 0,
  className,
  headerAction,
}: BrandProfileViewProps) {
  const activeCampaigns = campaigns.filter((c) => c.status === 'active' || c.status === 'draft')
  const completedCampaigns = campaigns.filter((c) => c.status === 'closed')

  return (
    <div className={cn('animate-fade-in', className)}>
      {headerAction && <div className="flex justify-end mb-3">{headerAction}</div>}

      <BrandProfileHeader profile={profile} />

      <div className="mt-4 rounded-xl border border-border bg-white px-4 py-4 text-center shadow-soft">
        <CheckCircle2 className="mx-auto h-5 w-5 text-brand-primary mb-1" />
        <p className="text-xl font-semibold text-text-primary">{completedCollaborations}</p>
        <p className="text-sm text-text-secondary">Completed Collaborations</p>
      </div>

      {profile.description && (
        <Card className="mt-6">
          <h2 className="text-sm font-medium text-text-secondary mb-2">About Company</h2>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {profile.description}
          </p>
        </Card>
      )}

      {(profile.website || profile.country) && (
        <div className="mt-4 space-y-3">
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white hover:border-brand-primary/30 transition-colors"
            >
              <Globe className="h-5 w-5 text-brand-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-text-secondary">Website</p>
                <p className="text-sm font-medium text-text-primary truncate">{profile.website}</p>
              </div>
            </a>
          )}
          {profile.country && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-white">
              <Globe className="h-5 w-5 text-brand-primary shrink-0" />
              <div>
                <p className="text-xs text-text-secondary">Country</p>
                <p className="text-sm font-medium text-text-primary">{profile.country}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Active Campaigns</h2>
        <CampaignList
          campaigns={activeCampaigns}
          emptyMessage="No active campaigns yet."
        />
      </div>

      <div className="mt-8 pt-8 border-t border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Completed Campaigns</h2>
        <CampaignList
          campaigns={completedCampaigns}
          emptyMessage="No completed campaigns yet."
        />
      </div>
    </div>
  )
}
