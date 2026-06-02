import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Pencil, Trash2, Users, Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { CampaignBudget } from '../../components/CampaignBudget'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import {
  countCampaignApplicants,
  deleteCampaign,
  fetchBrandCampaigns,
  statusLabel,
} from '../../lib/api'
import { formatDate } from '../../lib/constants'
import type { CampaignWithBrand } from '../../types/database'

export default function BrandCampaignList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadCampaigns() {
    if (!user) return
    setLoading(true)
    try {
      setCampaigns(await fetchBrandCampaigns(user.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [user])

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteCampaign(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader
        title="My Campaigns"
        subtitle="Manage your brand opportunities"
        action={
          <Link to="/brand/campaigns/create">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No campaigns yet"
          description="Create your first campaign to start receiving applications from creators."
          action={
            <Link to="/brand/campaigns/create">
              <Button>Create Campaign</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <BrandCampaignRow
              key={campaign.id}
              campaign={campaign}
              deleting={deletingId === campaign.id}
              onEdit={() => navigate(`/brand/campaigns/${campaign.id}/edit`)}
              onDelete={() => handleDelete(campaign.id, campaign.title)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BrandCampaignRow({
  campaign,
  deleting,
  onEdit,
  onDelete,
}: {
  campaign: CampaignWithBrand
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [applicants, setApplicants] = useState<number | null>(null)

  useEffect(() => {
    countCampaignApplicants(campaign.id).then(setApplicants)
  }, [campaign.id])

  const statusVariant =
    campaign.status === 'active' ? 'success' : campaign.status === 'draft' ? 'outline' : 'default'

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-text-primary">{campaign.title}</h3>
            <Badge variant={statusVariant}>{statusLabel(campaign.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {campaign.category}
            {campaign.platform ? ` · ${campaign.platform}` : ''}
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
          <p className="mt-1 text-xs text-text-secondary">
            Posted {formatDate(campaign.created_at)} · {applicants ?? 0} applicants
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/brand/campaigns/${campaign.id}/applicants`}>
          <Button size="sm" variant="secondary">
            <Users className="h-4 w-4" />
            Applicants
          </Button>
        </Link>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" loading={deleting} onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  )
}
