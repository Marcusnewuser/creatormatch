import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { CreatorProfileView } from '../../components/creator/CreatorProfileView'
import { ProfileSettingsButton } from '../../components/profile/ProfileSettingsButton'
import { useAuth } from '../../contexts/AuthContext'
import { fetchCreatorProfileWithPosts } from '../../lib/api'
import type { CreatorProfileWithPosts } from '../../types/database'

export default function CreatorProfilePage() {
  const { user } = useAuth()
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

  const username = data.profile.username ?? undefined

  return (
    <div className="relative pb-8">
      <div className="absolute right-4 top-4 z-20">
        <ProfileSettingsButton />
      </div>

      <div className="px-4 pt-4">
        <CreatorProfileView
          data={data}
          username={username}
          postsHeaderAction={
            <Link to="/creator/posts/create">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  )
}
