import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminFilterTabs } from '../../components/admin/AdminFilterTabs'
import { AdminTable, AdminTableRow, AdminTableCell } from '../../components/admin/AdminTable'
import {
  adminUpdateReport,
  fetchAdminReports,
  type AdminReport,
  type ReportStatus,
} from '../../lib/admin'
import { formatDate, formatRelativeTime } from '../../lib/constants'
import { useAuth } from '../../contexts/AuthContext'

const REPORT_LABELS: Record<string, string> = {
  fake_brand: 'Fake Brand',
  fake_creator: 'Fake Creator',
  spam: 'Spam',
  abuse: 'Abuse',
}

export default function AdminReportsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<AdminReport[]>([])
  const [status, setStatus] = useState<ReportStatus | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchAdminReports(status).then(setRows).finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  async function resolveReport(id: string, next: ReportStatus) {
    if (!user) return
    setActing(id)
    try {
      await adminUpdateReport(id, { status: next }, user.id)
      load()
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Reports" subtitle="Review user-submitted reports" />

      <div className="mb-6">
        <AdminFilterTabs
          options={[
            { value: 'pending' as const, label: 'Pending' },
            { value: 'resolved' as const, label: 'Resolved' },
            { value: 'dismissed' as const, label: 'Dismissed' },
            { value: 'all' as const, label: 'All' },
          ]}
          value={status}
          onChange={setStatus}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : rows.length === 0 ? (
        <p className="text-sm text-text-secondary">No reports in this category.</p>
      ) : (
        <AdminTable headers={['Type', 'Description', 'Status', 'Submitted', 'Actions']}>
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="font-medium">{REPORT_LABELS[row.report_type] ?? row.report_type}</AdminTableCell>
              <AdminTableCell className="max-w-xs truncate text-text-secondary">
                {row.description ?? '—'}
              </AdminTableCell>
              <AdminTableCell>
                <Badge variant={row.status === 'pending' ? 'warning' : 'default'}>{row.status}</Badge>
              </AdminTableCell>
              <AdminTableCell>
                <span title={formatDate(row.created_at)}>{formatRelativeTime(row.created_at)}</span>
              </AdminTableCell>
              <AdminTableCell>
                {row.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      loading={acting === row.id}
                      onClick={() => resolveReport(row.id, 'resolved')}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={acting === row.id}
                      onClick={() => resolveReport(row.id, 'dismissed')}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
