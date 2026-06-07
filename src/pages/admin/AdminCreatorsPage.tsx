import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Ban, CheckCircle, Trash2 } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminSearchInput } from '../../components/admin/AdminSearchInput'
import { AdminTable, AdminTableRow, AdminTableCell } from '../../components/admin/AdminTable'
import {
  adminDeleteCreatorProfile,
  adminSetUserSuspended,
  fetchAdminCreators,
  type AdminCreatorRow,
} from '../../lib/admin'

export default function AdminCreatorsPage() {
  const [rows, setRows] = useState<AdminCreatorRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchAdminCreators(search).then(setRows).finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Creator Management" subtitle="All creator profiles on the platform" />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search creators..." className="mb-6 max-w-md" />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable
          headers={['Creator', 'Posts', 'Applications', 'Collaborations', 'Country', 'Status', 'Actions']}
        >
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell>
                <div className="flex items-center gap-3">
                  <Avatar src={row.avatarUrl ?? undefined} name={row.fullName} size="sm" />
                  <span className="font-medium">{row.fullName}</span>
                </div>
              </AdminTableCell>
              <AdminTableCell>{row.totalPosts}</AdminTableCell>
              <AdminTableCell>{row.totalApplications}</AdminTableCell>
              <AdminTableCell>{row.totalCollaborations}</AdminTableCell>
              <AdminTableCell>{row.country ?? '—'}</AdminTableCell>
              <AdminTableCell>
                {row.isSuspended ? <Badge variant="warning">Suspended</Badge> : <Badge variant="success">Active</Badge>}
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex gap-1">
                  <Link to={`/admin/users/${row.userId}`}>
                    <Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5" /></Button>
                  </Link>
                  <Link to={`/creators/${row.userId}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">Profile</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting === row.userId}
                    onClick={async () => {
                      setActing(row.userId)
                      await adminSetUserSuspended(row.userId, !row.isSuspended)
                      load()
                      setActing(null)
                    }}
                  >
                    {row.isSuspended ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting === row.userId}
                    onClick={async () => {
                      if (!confirm('Delete creator profile?')) return
                      setActing(row.userId)
                      await adminDeleteCreatorProfile(row.userId)
                      load()
                      setActing(null)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
