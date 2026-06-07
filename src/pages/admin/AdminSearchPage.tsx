import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LoadingState } from '../../components/ui/LoadingState'
import { Card } from '../../components/ui/Card'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminGlobalSearch, type AdminSearchResult } from '../../lib/admin'

export default function AdminSearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const [results, setResults] = useState<AdminSearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (q.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    adminGlobalSearch(q)
      .then(setResults)
      .finally(() => setLoading(false))
  }, [q])

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title="Search" subtitle={q ? `Results for “${q}”` : 'Enter at least 2 characters in the header search'} />

      {loading && <LoadingState />}
      {!loading && q.length < 2 && (
        <p className="text-sm text-text-secondary">Use the search bar above to find users, creators, brands, and campaigns.</p>
      )}
      {!loading && results && (
        <div className="space-y-6">
          <SearchSection title="Users" items={results.users} />
          <SearchSection title="Creators" items={results.creators} />
          <SearchSection title="Brands" items={results.brands} />
          <SearchSection title="Campaigns" items={results.campaigns} />
        </div>
      )}
    </div>
  )
}

function SearchSection({
  title,
  items,
}: {
  title: string
  items: { id: string; label: string; subtitle: string; href: string }[]
}) {
  if (items.length === 0) return null
  return (
    <div>
      <h2 className="text-sm font-semibold text-text-secondary mb-2">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={`${title}-${item.id}`} to={item.href}>
            <Card hover className="py-3 px-4">
              <p className="font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.subtitle}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
