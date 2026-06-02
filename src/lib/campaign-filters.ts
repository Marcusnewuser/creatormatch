import type { CampaignStatus } from '../types/database'
import { parseBudgetAmount } from './currency'

export { parseBudgetAmount }

export const CAMPAIGN_PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Xiaohongshu',
  'Twitter/X',
  'Multi-platform',
] as const

export const CAMPAIGN_PLATFORMS_WITH_ALL = ['All', ...CAMPAIGN_PLATFORMS] as const

export const BUDGET_RANGES = [
  { id: 'all', label: 'All Budgets', min: 0, max: Infinity },
  { id: 'under-500', label: 'Under 500', min: 0, max: 499 },
  { id: '500-1000', label: '500 – 1,000', min: 500, max: 1000 },
  { id: '1000-2500', label: '1,000 – 2,500', min: 1000, max: 2500 },
  { id: '2500-plus', label: '2,500+', min: 2500, max: Infinity },
] as const

export const LOCATION_OPTIONS = [
  'All',
  'Remote',
  'United States',
  'Europe',
  'Asia',
  'Global',
] as const

export const CAMPAIGN_STATUSES: { value: CampaignStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
]

export function matchesBudgetRange(
  budget: string | null | undefined,
  rangeId: string,
): boolean {
  if (rangeId === 'all') return true
  const range = BUDGET_RANGES.find((r) => r.id === rangeId)
  if (!range) return true
  const amount = parseBudgetAmount(budget)
  if (amount === 0 && rangeId !== 'all') return false
  return amount >= range.min && amount <= range.max
}

export interface CampaignFilters {
  search?: string
  category?: string
  platform?: string
  location?: string
  budgetRange?: string
}

export function filterCampaigns<
  T extends {
    title: string
    category: string
    platform: string | null
    location: string | null
    budget: string | null
    brand_profiles?: { company_name: string | null } | null
  },
>(campaigns: T[], filters: CampaignFilters): T[] {
  const search = filters.search?.toLowerCase().trim() ?? ''
  const category = filters.category ?? 'All'
  const platform = filters.platform ?? 'All'
  const location = filters.location ?? 'All'
  const budgetRange = filters.budgetRange ?? 'all'

  return campaigns.filter((c) => {
    const brandName = c.brand_profiles?.company_name ?? ''
    const matchesSearch =
      !search ||
      c.title.toLowerCase().includes(search) ||
      brandName.toLowerCase().includes(search) ||
      (c.location?.toLowerCase().includes(search) ?? false)

    const matchesCategory = category === 'All' || c.category === category
    const matchesPlatform = platform === 'All' || c.platform === platform
    const matchesLocation =
      location === 'All' ||
      c.location?.toLowerCase() === location.toLowerCase() ||
      (location === 'Remote' && c.location?.toLowerCase().includes('remote'))
    const matchesBudget = matchesBudgetRange(c.budget, budgetRange)

    return matchesSearch && matchesCategory && matchesPlatform && matchesLocation && matchesBudget
  })
}
