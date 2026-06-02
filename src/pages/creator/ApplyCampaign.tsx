import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { formatBudget } from '../../lib/currency'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCampaignById, hasAppliedToCampaign, submitApplication } from '../../lib/api'
import type { CampaignWithBrand } from '../../types/database'

export default function ApplyCampaign() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null)
  const [message, setMessage] = useState('')
  const [portfolioLink, setPortfolioLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    fetchCampaignById(id)
      .then(async (data) => {
        setCampaign(data)
        if (data) {
          setAlreadyApplied(await hasAppliedToCampaign(user.id, data.id))
        }
      })
      .finally(() => setLoading(false))
  }, [id, user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !campaign || alreadyApplied) return
    setSubmitting(true)
    setError(null)
    try {
      await submitApplication({
        campaign_id: campaign.id,
        creator_id: user.id,
        brand_id: campaign.brand_id,
        message,
        portfolio_link: portfolioLink || null,
      })
      navigate('/creator/applications')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>
  if (!campaign) return <div className="px-4 pt-6 text-text-secondary">Campaign not found.</div>

  const brandName = campaign.brand_profiles?.company_name ?? 'Brand'

  if (alreadyApplied) {
    return (
      <div className="px-4 pt-6 pb-8 animate-fade-in">
        <PageHeader title="Apply to Campaign" subtitle={campaign.title} back />
        <Card className="text-center py-8">
          <p className="text-text-primary font-medium">You have already applied to this campaign.</p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/creator/applications')}>
            View My Applications
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title="Apply to Campaign" subtitle={campaign.title} back />

      <Card className="mb-6 animate-slide-up">
        <p className="text-sm text-text-secondary">
          Applying to <span className="font-medium text-text-primary">{campaign.title}</span> by{' '}
          <span className="font-medium text-text-primary">{brandName}</span>
        </p>
        {formatBudget(campaign.budget, campaign.currency) !== 'TBD' && (
          <p className="mt-1 text-sm text-brand-primary font-medium">
            Budget: {formatBudget(campaign.budget, campaign.currency)}
          </p>
        )}
      </Card>

      <form className="space-y-5 animate-slide-up stagger-1" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Textarea
          label="Motivation Message"
          placeholder="Tell the brand why you're a great fit for this campaign..."
          hint="Share your experience, audience insights, and creative ideas."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <Input
          label="Portfolio Link"
          type="url"
          placeholder="https://your-portfolio.com"
          hint="Link to your best work or media kit."
          value={portfolioLink}
          onChange={(e) => setPortfolioLink(e.target.value)}
        />
        <Button type="submit" fullWidth size="lg" loading={submitting}>
          Submit Application
        </Button>
      </form>
    </div>
  )
}
