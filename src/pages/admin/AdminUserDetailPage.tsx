import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle, Trash2 } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import {
  adminDeleteUser,
  adminSetUserSuspended,
  fetchAdminUserDetail,
} from '../../lib/admin'
import { formatDate } from '../../lib/constants'

export default function AdminUserDetailPage() {
  const { userId } = useParams()
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminUserDetail>>>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  function reload() {
    if (!userId) return
    fetchAdminUserDetail(userId).then(setData).finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [userId])

  if (loading) return <LoadingState />
  if (!data) return <p className="text-sm text-text-secondary">User not found.</p>

  const { profile, creator, brand, stats } = data
  const name = creator?.full_name ?? brand?.company_name ?? profile.email
  const suspended = Boolean(profile.is_suspended)

  return (
    <div className="animate-fade-in max-w-2xl">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-brand-primary mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      <Card className="mb-4">
        <div className="flex items-start gap-4">
          <Avatar
            src={creator?.avatar_url ?? brand?.logo_url ?? undefined}
            name={name}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
            <p className="text-sm text-text-secondary">{profile.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="primary">role_type: {profile.role ?? 'unset'}</Badge>
              {suspended ? <Badge variant="warning">Suspended</Badge> : <Badge variant="success">Active</Badge>}
            </div>
            <p className="text-xs text-text-secondary mt-2">Joined {formatDate(profile.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            loading={acting}
            disabled={profile.role === 'admin'}
            onClick={async () => {
              setActing(true)
              await adminSetUserSuspended(profile.id, !suspended)
              reload()
              setActing(false)
            }}
          >
            {suspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {suspended ? 'Reactivate' : 'Suspend'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={acting}
            disabled={profile.role === 'admin'}
            onClick={async () => {
              if (!confirm('Delete this user permanently?')) return
              setActing(true)
              await adminDeleteUser(profile.id)
              window.location.href = '/admin/users'
            }}
          >
            <Trash2 className="h-4 w-4 text-danger" />
            Delete
          </Button>
          {creator && (
            <Link to={`/creators/${profile.id}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">View creator profile</Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-secondary">Posts</p>
          <p className="text-2xl font-semibold">{stats.posts}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Applications</p>
          <p className="text-2xl font-semibold">{stats.applications}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Campaigns</p>
          <p className="text-2xl font-semibold">{stats.campaigns}</p>
        </Card>
      </div>
    </div>
  )
}
