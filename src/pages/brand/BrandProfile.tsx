import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, Pencil } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LogoutButton } from '../../components/LogoutButton'
import { LoadingState } from '../../components/ui/LoadingState'
import { BrandProfileView } from '../../components/brand/BrandProfileView'
import { useAuth } from '../../contexts/AuthContext'
import { fetchBrandCampaigns, fetchBrandProfile, countCompletedCollaborations } from '../../lib/api'
import { getProfileCreatePath } from '../../lib/auth-paths'
import type { BrandProfile, Campaign } from '../../types/database'

export default function BrandProfilePage() {
  const { user, hasCreatorProfile } = useAuth()
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
    <div className="px-4 pt-4 pb-8">
      <BrandProfileView
        profile={profile}
        campaigns={campaigns}
        completedCollaborations={completedCollaborations}
        headerAction={
          <Link to="/brand/profile/edit">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        }
      />

      {!hasCreatorProfile && (
        <Card className="mt-6 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
              <Camera className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-text-primary">Create Creator Profile</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Apply to campaigns and collaborate with brands — use the same account.
              </p>
              <Link to={getProfileCreatePath('creator')} className="inline-block mt-3">
                <Button size="sm">Create Creator Profile</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-8">
        <LogoutButton fullWidth />
      </div>
    </div>
  )
}
