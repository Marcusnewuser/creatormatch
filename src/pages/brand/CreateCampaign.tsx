import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { CampaignForm, type CampaignFormValues } from '../../components/CampaignForm'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { createCampaign, fetchBrandProfile } from '../../lib/api'
import { hasCampaignPlatformColumn } from '../../lib/schema'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return 'Failed to create campaign'
}

export default function CreateCampaign() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [defaultCountry, setDefaultCountry] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchBrandProfile(user.id)
      .then((profile) => setDefaultCountry(profile?.country ?? ''))
      .finally(() => setProfileLoading(false))
  }, [user])

  async function handleSubmit(values: CampaignFormValues) {
    if (!user) return
    if (!values.category) {
      setError('Please select a category')
      return
    }

    const platformRequired = await hasCampaignPlatformColumn()
    if (platformRequired && !values.platform) {
      setError('Please select a platform')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const requirements = values.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)

      const campaign = await createCampaign({
        brand_id: user.id,
        title: values.title,
        category: values.category,
        country: values.country || null,
        currency: values.currency || null,
        platform: values.platform || null,
        location: values.location || null,
        budget: values.budget || null,
        description: values.description || null,
        requirements,
        status: values.status,
      })

      navigate(`/brand/campaigns/${campaign.id}/applicants`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title="Create Campaign" subtitle="Post a new opportunity for creators" back />
      <CampaignForm
        defaultCountry={defaultCountry}
        submitLabel="Publish Campaign"
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
