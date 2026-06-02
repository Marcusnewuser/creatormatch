import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, Calendar, CheckCircle, ArrowLeft, Monitor, Globe } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { CampaignBudget } from '../../components/CampaignBudget'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCampaignById, hasAppliedToCampaign } from '../../lib/api'
import { formatDate } from '../../lib/constants'
import type { CampaignWithBrand } from '../../types/database'

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null)
  const [applied, setApplied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchCampaignById(id)
      .then(async (data) => {
        setCampaign(data)
        if (user && data) {
          setApplied(await hasAppliedToCampaign(user.id, data.id))
        }
      })
      .finally(() => setLoading(false))
  }, [id, user])

  if (loading) return <LoadingState />
  if (!campaign) {
    return (
      <div className="px-4 pt-6 text-center text-text-secondary">
        Campaign not found.
      </div>
    )
  }

  const brandName = campaign.brand_profiles?.company_name ?? 'Brand'
  const requirements = Array.isArray(campaign.requirements) ? campaign.requirements : []

  return (
    <div className="animate-fade-in">
      <div className="relative bg-gradient-to-br from-brand-primary to-brand-secondary px-4 pt-6 pb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 backdrop-blur text-text-secondary hover:bg-white shadow-soft transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="mt-6 text-sm text-white/80">{brandName}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{campaign.title}</h1>
      </div>

      <div className="px-4 pt-4 pb-8 -mt-6 relative">
        <Card className="animate-slide-up">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{campaign.category}</Badge>
            {campaign.platform && <Badge variant="outline">{campaign.platform}</Badge>}
            {campaign.country && <Badge variant="outline">{campaign.country}</Badge>}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
            <CampaignBudget
              budget={campaign.budget}
              currency={campaign.currency}
              className="font-medium text-text-primary"
              iconClassName="text-brand-primary h-4 w-4"
            />
            {campaign.platform && (
              <span className="flex items-center gap-1.5">
                <Monitor className="h-4 w-4 text-brand-primary" />
                {campaign.platform}
              </span>
            )}
            {campaign.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-primary" />
                {campaign.location}
              </span>
            )}
            {campaign.country && (
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-brand-primary" />
                {campaign.country}
                {campaign.currency ? ` (${campaign.currency})` : ''}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-primary" />
              Posted {formatDate(campaign.created_at)}
            </span>
          </div>
        </Card>

        {campaign.description && (
          <div className="mt-6 animate-slide-up stagger-1">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Description</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{campaign.description}</p>
          </div>
        )}

        {requirements.length > 0 && (
          <div className="mt-6 animate-slide-up stagger-2">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Requirements</h2>
            <ul className="space-y-2">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 animate-slide-up stagger-3">
          {applied ? (
            <Button fullWidth size="lg" variant="secondary" disabled>
              Already Applied
            </Button>
          ) : (
            <Link to={`/creator/campaigns/${campaign.id}/apply`}>
              <Button fullWidth size="lg">Apply Now</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
