import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminFilterTabs } from '../../components/admin/AdminFilterTabs'
import { AdminTable, AdminTableRow, AdminTableCell } from '../../components/admin/AdminTable'
import { fetchAdminApplications, type AdminApplicationRow } from '../../lib/admin'
import { applicationStatusLabel } from '../../lib/api'

const STATUS_OPTIONS = [
  'all',
  'pending',
  'accepted',
  'in_progress',
  'content_submitted',
  'approved',
  'completed',
  'rejected',
] as const

export default function AdminApplicationsPage() {
  const [rows, setRows] = useState<AdminApplicationRow[]>([])
  const [status, setStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    fetchAdminApplications(status).then(setRows).finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Application Management" subtitle="All creator applications across campaigns" />

      <div className="mb-6">
      <AdminFilterTabs
        options={STATUS_OPTIONS.map((s) => ({
          value: s,
          label: s === 'all' ? 'All' : applicationStatusLabel(s as AdminApplicationRow['status']),
        }))}
        value={status}
        onChange={setStatus}
      />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable headers={['Creator', 'Brand', 'Campaign', 'Status']}>
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="font-medium">{row.creatorName}</AdminTableCell>
              <AdminTableCell>{row.brandName}</AdminTableCell>
              <AdminTableCell>{row.campaignTitle}</AdminTableCell>
              <AdminTableCell>
                <Badge>{applicationStatusLabel(row.status)}</Badge>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
