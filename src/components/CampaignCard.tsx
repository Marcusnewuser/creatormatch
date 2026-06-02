import { Link } from 'react-router-dom'
import { MapPin, Monitor } from 'lucide-react'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { CampaignBudget } from './CampaignBudget'
import { formatDate } from '../lib/constants'
import type { CampaignWithBrand } from '../types/database'

interface CampaignCardProps {
  campaign: CampaignWithBrand
  linkPrefix?: string
}

export function CampaignCard({ campaign, linkPrefix = '/creator/campaigns' }: CampaignCardProps) {
  const brandName = campaign.brand_profiles?.company_name ?? 'Brand'

  return (
    <Link to={`${linkPrefix}/${campaign.id}`}>
      <Card hover className="overflow-hidden animate-slide-up">
        <div className="h-2 bg-gradient-to-r from-brand-primary to-brand-secondary" />
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-text-primary line-clamp-1">{campaign.title}</h3>
              <p className="text-sm text-text-secondary mt-0.5">{brandName}</p>
            </div>
            <Badge variant="primary">{campaign.category}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
            <CampaignBudget budget={campaign.budget} currency={campaign.currency} />
            {campaign.platform && (
              <span className="flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5" />
                {campaign.platform}
              </span>
            )}
            {campaign.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {campaign.location}
              </span>
            )}
            {campaign.country && (
              <span className="text-xs">{campaign.country}</span>
            )}
          </div>
          <p className="text-xs text-text-secondary">Posted {formatDate(campaign.created_at)}</p>
        </div>
      </Card>
    </Link>
  )
}
