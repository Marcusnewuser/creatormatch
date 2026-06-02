import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { CampaignForm, type CampaignFormValues } from '../../components/CampaignForm'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCampaignById, updateCampaign } from '../../lib/api'
import { hasCampaignPlatformColumn } from '../../lib/schema'
import type { CampaignWithBrand } from '../../types/database'

export default function EditCampaign() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchCampaignById(id)
      .then((data) => {
        if (data && user && data.brand_id !== user.id) {
          setError('You do not have permission to edit this campaign.')
          return
        }
        setCampaign(data)
      })
      .finally(() => setLoading(false))
  }, [id, user])

  async function handleSubmit(values: CampaignFormValues) {
    if (!id || !campaign) return
    if (!values.category) {
      setError('Please select a category')
      return
    }

    const platformRequired = await hasCampaignPlatformColumn()
    if (platformRequired && !values.platform) {
      setError('Please select a platform')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const requirements = values.requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)

      await updateCampaign(id, {
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

      navigate('/brand/campaigns')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  if (!campaign) {
    return (
      <div className="px-4 pt-6 text-center text-text-secondary">
        Campaign not found.
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title="Edit Campaign" subtitle={campaign.title} back />
      <CampaignForm
        initial={campaign}
        submitLabel="Save Changes"
        loading={saving}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
