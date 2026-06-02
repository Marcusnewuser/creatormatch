import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink, MapPin } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import {
  applicationStatusBadgeVariant,
  applicationStatusLabel,
  fetchCampaignApplications,
  fetchCampaignById,
} from '../../lib/api'
import { formatFollowers } from '../../lib/constants'
import type { ApplicationWithCreator } from '../../types/database'
import type { CampaignWithBrand } from '../../types/database'

export default function ApplicantList() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null)
  const [applicants, setApplicants] = useState<ApplicationWithCreator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([fetchCampaignById(id), fetchCampaignApplications(id)])
      .then(([campaignData, apps]) => {
        setCampaign(campaignData)
        setApplicants(apps)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader
        title="Applicants"
        subtitle={`${campaign?.title ?? 'Campaign'} · ${applicants.length} applicants`}
        back
      />

      {applicants.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-12">No applicants yet.</p>
      ) : (
        <div className="space-y-3">
          {applicants.map((applicant) => {
            const creator = applicant.creator_profiles
            const statusVariant = applicationStatusBadgeVariant(applicant.status)

            return (
              <Card key={applicant.id} hover className="animate-slide-up">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={creator?.avatar_url ?? undefined}
                    name={creator?.full_name ?? 'Creator'}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{creator?.full_name ?? 'Creator'}</h3>
                      <Badge variant={statusVariant}>{applicationStatusLabel(applicant.status)}</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{creator?.category ?? 'Creator'}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-secondary">
                      <span>{formatFollowers(creator?.follower_count)} followers</span>
                      {creator?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {creator.location}
                        </span>
                      )}
                    </div>
                    {applicant.portfolio_link && (
                      <a
                        href={applicant.portfolio_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Portfolio <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Link to={`/brand/applicants/${applicant.id}`}>
                    <Button variant="outline" size="sm">View Profile</Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
