import { Select } from './ui/Select'
import { CAMPAIGN_CATEGORIES_WITH_ALL } from '../lib/constants'
import {
  BUDGET_RANGES,
  CAMPAIGN_PLATFORMS_WITH_ALL,
  LOCATION_OPTIONS,
  type CampaignFilters,
} from '../lib/campaign-filters'
import { cn } from '../lib/utils'

interface CampaignFiltersBarProps {
  filters: CampaignFilters
  onChange: (filters: CampaignFilters) => void
  showCategoryPills?: boolean
}

export function CampaignFiltersBar({
  filters,
  onChange,
  showCategoryPills = true,
}: CampaignFiltersBarProps) {
  const category = filters.category ?? 'All'

  function update(partial: Partial<CampaignFilters>) {
    onChange({ ...filters, ...partial })
  }

  return (
    <div className="space-y-4 mb-6">
      {showCategoryPills && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {CAMPAIGN_CATEGORIES_WITH_ALL.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => update({ category: cat })}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                category === cat
                  ? 'bg-brand-primary text-white shadow-soft'
                  : 'bg-white border border-border text-text-secondary hover:border-brand-primary/30',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Platform"
          value={filters.platform ?? 'All'}
          onChange={(e) => update({ platform: e.target.value })}
          options={CAMPAIGN_PLATFORMS_WITH_ALL.map((p) => ({ value: p, label: p }))}
        />
        <Select
          label="Budget"
          value={filters.budgetRange ?? 'all'}
          onChange={(e) => update({ budgetRange: e.target.value })}
          options={BUDGET_RANGES.map((r) => ({ value: r.id, label: r.label }))}
        />
        <Select
          label="Location"
          value={filters.location ?? 'All'}
          onChange={(e) => update({ location: e.target.value })}
          options={LOCATION_OPTIONS.map((l) => ({ value: l, label: l }))}
        />
      </div>
    </div>
  )
}
