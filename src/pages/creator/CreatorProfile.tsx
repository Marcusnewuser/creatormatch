import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Eye, Pencil, Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LogoutButton } from '../../components/LogoutButton'
import { LoadingState } from '../../components/ui/LoadingState'
import { CreatorProfileView } from '../../components/creator/CreatorProfileView'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCreatorProfileWithPosts } from '../../lib/api'
import { getProfileCreatePath } from '../../lib/auth-paths'
import type { CreatorProfileWithPosts } from '../../types/database'

export default function CreatorProfilePage() {
  const { user, hasBrandProfile } = useAuth()
  const [data, setData] = useState<CreatorProfileWithPosts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchCreatorProfileWithPosts(user.id).then(setData).finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>
  if (!data) {
    return (
      <div className="px-4 pt-6 text-center text-text-secondary">
        Profile not found.
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8">
      <CreatorProfileView
        data={data}
        headerAction={
          <div className="flex items-center gap-2">
            <Link to={`/creators/${user?.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
                Public View
              </Button>
            </Link>
            <Link to="/creator/profile/edit">
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        }
        postsHeaderAction={
            <Link to="/creator/posts/create">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            </Link>
        }
      />

      {!hasBrandProfile && (
        <Card className="mt-6 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-text-primary">Create Brand Profile</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Represent a business and hire creators — use the same account.
              </p>
              <Link to={getProfileCreatePath('brand')} className="inline-block mt-3">
                <Button size="sm">Create Brand Profile</Button>
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
