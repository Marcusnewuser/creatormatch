import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { User } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { CreatorProfileView } from '../components/creator/CreatorProfileView'
import { fetchCreatorProfileWithPosts } from '../lib/api'
import { recordCreatorProfileView } from '../lib/notifications'
import type { CreatorProfileWithPosts } from '../types/database'

export default function PublicCreatorProfile() {
  const { userId } = useParams()
  const [data, setData] = useState<CreatorProfileWithPosts | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchCreatorProfileWithPosts(userId)
      .then((result) => {
        if (!result) setNotFound(true)
        else setData(result)
      })
      .finally(() => setLoading(false))

    recordCreatorProfileView(userId).catch(() => undefined)
  }, [userId])

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  if (notFound || !data) {
    return (
      <div className="px-4 pt-6 pb-8">
        <PageHeader title="Creator Profile" back />
        <EmptyState icon={User} title="Profile not found" description="This creator profile does not exist." />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <PageHeader
        title={data.profile.full_name ?? 'Creator Profile'}
        subtitle="Creator"
        back
      />
      <CreatorProfileView data={data} username={data.profile.username ?? undefined} />
    </div>
  )
}
