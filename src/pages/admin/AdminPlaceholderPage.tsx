import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Users, Building2, Megaphone, FileText, BarChart3 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { LoadingState } from '../../components/ui/LoadingState'
import { fetchAdminList } from '../../lib/api'
import { formatDate } from '../../lib/constants'

const adminPages = {
  creators: { title: 'Creators', icon: Users, type: 'creators' as const },
  brands: { title: 'Brands', icon: Building2, type: 'brands' as const },
  campaigns: { title: 'Campaigns', icon: Megaphone, type: 'campaigns' as const },
  applications: { title: 'Applications', icon: FileText, type: 'applications' as const },
  reports: { title: 'Reports', icon: BarChart3, type: null },
}

export default function AdminPlaceholderPage() {
  const location = useLocation()
  const segment = location.pathname.split('/').pop() as keyof typeof adminPages
  const page = adminPages[segment] ?? adminPages.creators
  const [items, setItems] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!page.type) {
      setLoading(false)
      return
    }
    fetchAdminList(page.type)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [page.type])

  if (loading) return <LoadingState />

  if (!page.type) {
    return (
      <div className="animate-fade-in">
        <PageHeader title={page.title} subtitle="Platform analytics and reports" />
        <Card className="py-12 text-center text-sm text-text-secondary">
          Reports dashboard coming soon. Use the main dashboard for live platform stats.
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title={page.title} subtitle={`All ${page.title.toLowerCase()} on the platform`} />

      {items.length === 0 ? (
        <Card className="py-12 text-center text-sm text-text-secondary">No records found.</Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={(item as { id: string }).id}>
              <AdminListItem type={page.type!} item={item} />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminListItem({ type, item }: { type: 'creators' | 'brands' | 'campaigns' | 'applications'; item: unknown }) {
  const record = item as Record<string, unknown>

  if (type === 'creators') {
    return (
      <div>
        <p className="font-medium text-text-primary">{record.full_name as string ?? 'Unnamed'}</p>
        <p className="text-sm text-text-secondary">{record.category as string} · {formatDate(record.created_at as string)}</p>
      </div>
    )
  }

  if (type === 'brands') {
    return (
      <div>
        <p className="font-medium text-text-primary">{record.company_name as string ?? 'Unnamed'}</p>
        <p className="text-sm text-text-secondary">{record.industry as string} · {formatDate(record.created_at as string)}</p>
      </div>
    )
  }

  if (type === 'campaigns') {
    const brand = record.brand_profiles as { company_name: string } | null
    return (
      <div>
        <p className="font-medium text-text-primary">{record.title as string}</p>
        <p className="text-sm text-text-secondary">
          {brand?.company_name ?? 'Brand'} · {record.status as string} · {formatDate(record.created_at as string)}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-medium text-text-primary">Application</p>
      <p className="text-sm text-text-secondary">{record.status as string} · {formatDate(record.created_at as string)}</p>
    </div>
  )
}
