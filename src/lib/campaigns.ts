import { requireSupabase } from './supabase'
import {
  hasCampaignPlatformColumn,
  hasCampaignSystemV2,
  hasCurrencyColumns,
  normalizeCampaign,
  toCampaignWritePayload,
} from './schema'
import type { Campaign, CampaignStatus, CampaignWithBrand } from '../types/database'

export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
export type CampaignUpdate = Partial<Omit<Campaign, 'id' | 'brand_id' | 'created_at'>>

export async function attachBrandProfiles(
  campaigns: Record<string, unknown>[],
): Promise<CampaignWithBrand[]> {
  const normalized = campaigns.map(normalizeCampaign)
  if (!normalized.length) return []

  const brandIds = [...new Set(normalized.map((c) => c.brand_id))]
  const { data: brands, error } = await requireSupabase()
    .from('brand_profiles')
    .select('user_id, company_name, logo_url')
    .in('user_id', brandIds)

  if (error) throw error

  const brandMap = new Map((brands ?? []).map((b) => [b.user_id, b]))
  return normalized.map((c) => ({
    ...c,
    brand_profiles: brandMap.get(c.brand_id) ?? null,
  }))
}

export async function fetchActiveCampaigns(): Promise<CampaignWithBrand[]> {
  const { data, error } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return attachBrandProfiles(data ?? [])
}

export async function fetchRecentCampaigns(limit = 6): Promise<CampaignWithBrand[]> {
  const { data, error } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return attachBrandProfiles(data ?? [])
}

export async function fetchCampaignById(id: string): Promise<CampaignWithBrand | null> {
  const { data, error } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const [campaign] = await attachBrandProfiles([data])
  return campaign
}

export async function fetchBrandCampaigns(brandId: string): Promise<CampaignWithBrand[]> {
  const campaignV2 = await hasCampaignSystemV2()
  const column = campaignV2 ? 'brand_id' : 'brand_user_id'
  const { data, error } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq(column, brandId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return attachBrandProfiles(data ?? [])
}

export async function createCampaign(campaign: CampaignInsert): Promise<Campaign> {
  const [campaignV2, currencyMigrated, platformMigrated] = await Promise.all([
    hasCampaignSystemV2(),
    hasCurrencyColumns(),
    hasCampaignPlatformColumn(),
  ])
  const payload = toCampaignWritePayload(
    campaign as unknown as Record<string, unknown>,
    campaignV2,
    currencyMigrated,
    platformMigrated,
  )

  const { data, error } = await requireSupabase()
    .from('campaigns')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return normalizeCampaign(data)
}

export async function updateCampaign(id: string, updates: CampaignUpdate): Promise<Campaign> {
  const [campaignV2, currencyMigrated, platformMigrated] = await Promise.all([
    hasCampaignSystemV2(),
    hasCurrencyColumns(),
    hasCampaignPlatformColumn(),
  ])
  const payload = toCampaignWritePayload(
    updates as unknown as Record<string, unknown>,
    campaignV2,
    currencyMigrated,
    platformMigrated,
  )

  const { data, error } = await requireSupabase()
    .from('campaigns')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalizeCampaign(data)
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await requireSupabase().from('campaigns').delete().eq('id', id)
  if (error) throw error
}

export async function fetchBrandCampaignStats(brandId: string) {
  const campaignV2 = await hasCampaignSystemV2()
  const column = campaignV2 ? 'brand_id' : 'brand_user_id'
  const { data, error } = await requireSupabase()
    .from('campaigns')
    .select('status')
    .eq(column, brandId)
  if (error) throw error

  const items = data ?? []
  return {
    total: items.length,
    active: items.filter((c) => c.status === 'active').length,
    draft: items.filter((c) => c.status === 'draft').length,
    closed: items.filter((c) => c.status === 'closed').length,
  }
}

export async function countBrandActiveCampaigns(brandId: string) {
  const campaignV2 = await hasCampaignSystemV2()
  const column = campaignV2 ? 'brand_id' : 'brand_user_id'
  const { count, error } = await requireSupabase()
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq(column, brandId)
    .eq('status', 'active')
  if (error) throw error
  return count ?? 0
}

export async function countCampaignApplicants(campaignId: string) {
  const { count, error } = await requireSupabase()
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
  if (error) throw error
  return count ?? 0
}

export function statusLabel(status: CampaignStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'draft':
      return 'Draft'
    case 'closed':
      return 'Closed'
  }
}
