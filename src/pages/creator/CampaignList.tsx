import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { SearchBar } from '../../components/ui/SearchBar'
import { CampaignCard } from '../../components/CampaignCard'
import { CampaignFiltersBar } from '../../components/CampaignFiltersBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { Briefcase } from 'lucide-react'
import { fetchActiveCampaigns } from '../../lib/api'
import { filterCampaigns, type CampaignFilters } from '../../lib/campaign-filters'
import type { CampaignWithBrand } from '../../types/database'

export default function CampaignList() {
  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    category: 'All',
    platform: 'All',
    location: 'All',
    budgetRange: 'all',
  })
  const [campaigns, setCampaigns] = useState<CampaignWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActiveCampaigns()
      .then(setCampaigns)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load campaigns'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => filterCampaigns(campaigns, filters), [campaigns, filters])

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 animate-fade-in">
      <PageHeader title="Campaigns" subtitle="Find your next brand partnership" />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <SearchBar
        placeholder="Search campaigns..."
        value={filters.search ?? ''}
        onChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        className="mb-4"
      />

      <CampaignFiltersBar filters={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No campaigns found"
          description="Try adjusting your search or filters to find more opportunities."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  )
}
