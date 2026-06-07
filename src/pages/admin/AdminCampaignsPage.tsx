import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminSearchInput } from '../../components/admin/AdminSearchInput'
import { AdminFilterTabs } from '../../components/admin/AdminFilterTabs'
import { AdminTable, AdminTableRow, AdminTableCell } from '../../components/admin/AdminTable'
import {
  adminDeleteCampaign,
  adminUpdateCampaign,
  fetchAdminCampaigns,
  type AdminCampaignRow,
} from '../../lib/admin'
import { formatDate } from '../../lib/constants'
import { statusLabel } from '../../lib/campaigns'

export default function AdminCampaignsPage() {
  const [rows, setRows] = useState<AdminCampaignRow[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminCampaignRow | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchAdminCampaigns({ search, status }).then(setRows).finally(() => setLoading(false))
  }, [search, status])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Campaign Management" subtitle="View, edit, and remove campaigns" />

      <div className="flex flex-col gap-4 mb-6">
        <AdminFilterTabs
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'closed', label: 'Closed' },
          ]}
          value={status}
          onChange={setStatus}
        />
        <AdminSearchInput value={search} onChange={setSearch} placeholder="Search campaigns..." className="max-w-md" />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <AdminTable headers={['Title', 'Brand', 'Budget', 'Status', 'Applications', 'Created', 'Actions']}>
          {rows.map((row) => (
            <AdminTableRow key={row.id}>
              <AdminTableCell className="font-medium">{row.title}</AdminTableCell>
              <AdminTableCell>{row.brand_profiles?.company_name ?? '—'}</AdminTableCell>
              <AdminTableCell>{row.budget ?? '—'}</AdminTableCell>
              <AdminTableCell>
                <Badge>{statusLabel(row.status)}</Badge>
              </AdminTableCell>
              <AdminTableCell>{row.applicationsCount}</AdminTableCell>
              <AdminTableCell>{formatDate(row.created_at)}</AdminTableCell>
              <AdminTableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm('Delete this campaign?')) return
                      await adminDeleteCampaign(row.id)
                      load()
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

      {editing && (
        <CampaignEditModal
          campaign={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function CampaignEditModal({
  campaign,
  onClose,
  onSaved,
}: {
  campaign: AdminCampaignRow
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(campaign.title)
  const [budget, setBudget] = useState(campaign.budget ?? '')
  const [status, setStatus] = useState(campaign.status)
  const [saving, setSaving] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated">
        <h2 className="text-lg font-semibold mb-4">Edit Campaign</h2>
        <div className="space-y-3">
          <input
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <input
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget"
          />
          <select
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminCampaignRow['status'])}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex gap-2 mt-6 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={saving}
            onClick={async () => {
              setSaving(true)
              await adminUpdateCampaign(campaign.id, { title, budget, status })
              setSaving(false)
              onSaved()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
