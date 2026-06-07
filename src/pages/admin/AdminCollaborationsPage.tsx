import { useEffect, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminTable, AdminTableRow, AdminTableCell } from '../../components/admin/AdminTable'
import { fetchAdminCollaborations, type AdminCollaborationRow } from '../../lib/admin'
import { applicationStatusLabel } from '../../lib/api'
import { formatDate } from '../../lib/constants'

export default function AdminCollaborationsPage() {
  const [rows, setRows] = useState<AdminCollaborationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminCollaborations()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Collaboration Management" subtitle="Monitor active collaboration conversations" />

      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-secondary">No collaborations yet.</p>
      ) : (
        <AdminTable headers={['Creator', 'Brand', 'Campaign', 'Status', 'Started']}>
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="font-medium">{row.creatorName}</AdminTableCell>
              <AdminTableCell>{row.brandName}</AdminTableCell>
              <AdminTableCell>{row.campaignTitle}</AdminTableCell>
              <AdminTableCell>
                <Badge>{applicationStatusLabel(row.status)}</Badge>
              </AdminTableCell>
              <AdminTableCell>{formatDate(row.createdAt)}</AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
