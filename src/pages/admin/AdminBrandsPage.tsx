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
  adminDeleteBrandProfile,
  adminSetUserSuspended,
  fetchAdminBrands,
  type AdminBrandRow,
} from '../../lib/admin'

export default function AdminBrandsPage() {
  const [rows, setRows] = useState<AdminBrandRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchAdminBrands(search).then(setRows).finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Brand Management" subtitle="All brand profiles on the platform" />
      <AdminSearchInput value={search} onChange={setSearch} placeholder="Search brands..." className="mb-6 max-w-md" />

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable
          headers={['Brand', 'Industry', 'Active Campaigns', 'Applications', 'Country', 'Status', 'Actions']}
        >
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell>
                <div className="flex items-center gap-3">
                  <Avatar src={row.logoUrl ?? undefined} name={row.companyName} size="sm" />
                  <span className="font-medium">{row.companyName}</span>
                </div>
              </AdminTableCell>
              <AdminTableCell>{row.industry ?? '—'}</AdminTableCell>
              <AdminTableCell>{row.activeCampaigns}</AdminTableCell>
              <AdminTableCell>{row.totalApplications}</AdminTableCell>
              <AdminTableCell>{row.country ?? '—'}</AdminTableCell>
              <AdminTableCell>
                {row.isSuspended ? <Badge variant="warning">Suspended</Badge> : <Badge variant="success">Active</Badge>}
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex gap-1">
                  <Link to={`/admin/users/${row.userId}`}>
                    <Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5" /></Button>
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
                      if (!confirm('Delete brand profile?')) return
                      setActing(row.userId)
                      await adminDeleteBrandProfile(row.userId)
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
