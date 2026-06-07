import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Ban, CheckCircle, Trash2 } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminSearchInput } from '../../components/admin/AdminSearchInput'
import { AdminFilterTabs } from '../../components/admin/AdminFilterTabs'
import { AdminTable, AdminTableRow, AdminTableCell } from '../../components/admin/AdminTable'
import {
  adminDeleteUser,
  adminSetUserSuspended,
  fetchAdminUsers,
  type AdminUserRow,
} from '../../lib/admin'
import { formatDate } from '../../lib/constants'

type RoleFilter = 'all' | 'creator' | 'brand' | 'admin'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchAdminUsers({ search, roleFilter })
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [search, roleFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  async function toggleSuspend(user: AdminUserRow) {
    setActing(user.id)
    try {
      await adminSetUserSuspended(user.id, !user.isSuspended)
      load()
    } finally {
      setActing(null)
    }
  }

  async function remove(user: AdminUserRow) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return
    setActing(user.id)
    try {
      await adminDeleteUser(user.id)
      load()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="User Management" subtitle="All platform accounts (role_type on profiles.role)" />

      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <AdminFilterTabs
          options={[
            { value: 'all' as const, label: 'All' },
            { value: 'creator' as const, label: 'Creators' },
            { value: 'brand' as const, label: 'Brands' },
            { value: 'admin' as const, label: 'Admins' },
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
        />
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search name or email..." className="sm:max-w-xs" />
      </div>

      {loading ? (
        <LoadingState />
      ) : users.length === 0 ? (
        <p className="text-sm text-text-secondary">No users found.</p>
      ) : (
        <AdminTable headers={['User', 'Email', 'Role', 'Country', 'Joined', 'Status', 'Actions']}>
          {users.map((user) => (
            <AdminTableRow key={user.id}>
              <AdminTableCell>
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatarUrl ?? undefined} name={user.name} size="sm" />
                  <span className="font-medium">{user.name}</span>
                </div>
              </AdminTableCell>
              <AdminTableCell className="text-text-secondary">{user.email}</AdminTableCell>
              <AdminTableCell>
                <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>{user.roleLabel}</Badge>
              </AdminTableCell>
              <AdminTableCell>{user.country ?? '—'}</AdminTableCell>
              <AdminTableCell>{formatDate(user.createdAt)}</AdminTableCell>
              <AdminTableCell>
                {user.isSuspended ? (
                  <Badge variant="warning">Suspended</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex flex-wrap gap-1">
                  <Link to={`/admin/users/${user.id}`}>
                    <Button size="sm" variant="outline" disabled={acting === user.id}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting === user.id || user.role === 'admin'}
                    onClick={() => toggleSuspend(user)}
                  >
                    {user.isSuspended ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting === user.id || user.role === 'admin'}
                    onClick={() => remove(user)}
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
