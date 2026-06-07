import { useEffect, useState } from 'react'
import { LoadingState } from '../../components/ui/LoadingState'
import { BrandProfileView } from '../../components/brand/BrandProfileView'
import { ProfileSettingsButton } from '../../components/profile/ProfileSettingsButton'
import { useAuth } from '../../contexts/AuthContext'
import { fetchBrandCampaigns, fetchBrandProfile, countCompletedCollaborations } from '../../lib/api'
import type { BrandProfile, Campaign } from '../../types/database'

export default function BrandProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [completedCollaborations, setCompletedCollaborations] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchBrandProfile(user.id),
      fetchBrandCampaigns(user.id),
      countCompletedCollaborations(user.id, 'brand'),
    ])
      .then(([brandProfile, brandCampaigns, completedCount]) => {
        setProfile(brandProfile)
        setCampaigns(brandCampaigns)
        setCompletedCollaborations(completedCount)
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>
  if (!profile) {
    return (
      <div className="px-4 pt-6 text-center text-text-secondary">
        Profile not found.
      </div>
    )
  }

  return (
    <div className="relative pb-8">
      <div className="absolute right-4 top-4 z-20">
        <ProfileSettingsButton />
      </div>

      <div className="px-4 pt-4">
        <BrandProfileView
          profile={profile}
          campaigns={campaigns}
          completedCollaborations={completedCollaborations}
        />
      </div>
    </div>
  )
}
