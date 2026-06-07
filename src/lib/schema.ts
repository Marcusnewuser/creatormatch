import { requireSupabase, isSupabaseConfigured, supabase } from './supabase'
import type { Application, ApplicationStatus, Campaign, CampaignStatus } from '../types/database'

let currencyColumnsCache: boolean | null = null
let campaignSystemCache: boolean | null = null
let applicationSystemCache: boolean | null = null
let primaryModeColumnCache: boolean | null = null
let platformColumnCache: boolean | null = null
let portfolioColumnsCache: boolean | null = null
let portfolioTablesCache: boolean | null = null
let brandBannerColumnCache: boolean | null = null
let notificationsTableCache: boolean | null = null
let notificationRoleContextCache: boolean | null = null

/** Migration 004 — country/currency columns */
export async function hasCurrencyColumns(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (currencyColumnsCache !== null) return currencyColumnsCache

  const { error } = await requireSupabase()
    .from('creator_profiles')
    .select('country, preferred_currency')
    .limit(0)

  currencyColumnsCache = !error
  return currencyColumnsCache
}

/** Migration 002 — campaigns.brand_id */
export async function hasCampaignSystemV2(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (campaignSystemCache !== null) return campaignSystemCache

  const { error } = await requireSupabase().from('campaigns').select('brand_id').limit(0)
  campaignSystemCache = !error
  return campaignSystemCache
}

/** Migration 003 — applications.creator_id, brand_id, message */
export async function hasApplicationSystemV2(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (applicationSystemCache !== null) return applicationSystemCache

  const { error } = await requireSupabase().from('applications').select('creator_id').limit(0)
  applicationSystemCache = !error
  return applicationSystemCache
}

/** Migration 006 — creator portfolio columns */
export async function hasPortfolioColumns(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (portfolioColumnsCache !== null) return portfolioColumnsCache

  const { error } = await requireSupabase().from('creator_profiles').select('banner_url').limit(0)
  portfolioColumnsCache = !error
  return portfolioColumnsCache
}

let creatorSocialColumnsCache: boolean | null = null

/** Migration 019 — username, tiktok_url, youtube_url */
export async function hasCreatorSocialColumns(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (creatorSocialColumnsCache !== null) return creatorSocialColumnsCache

  const { error } = await requireSupabase().from('creator_profiles').select('username, tiktok_url').limit(0)
  creatorSocialColumnsCache = !error
  return creatorSocialColumnsCache
}

let collaborationTablesCache: boolean | null = null
let collaborationCompletionsCache: boolean | null = null

/** Migration 015 — conversations */
export async function hasCollaborationTables(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (collaborationTablesCache !== null) return collaborationTablesCache

  const { error } = await requireSupabase().from('conversations').select('id').limit(0)
  collaborationTablesCache = !error
  return collaborationTablesCache
}

/** Migration 021 — collaboration_completions (permanent completed stats) */
export async function hasCollaborationCompletionsTable(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (collaborationCompletionsCache !== null) return collaborationCompletionsCache

  const { error } = await requireSupabase().from('collaboration_completions').select('id').limit(0)
  collaborationCompletionsCache = !error
  return collaborationCompletionsCache
}
/** Migration 010 — notifications */
export async function hasNotificationsTable(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (notificationsTableCache !== null) return notificationsTableCache

  const { error } = await requireSupabase().from('notifications').select('id').limit(0)
  notificationsTableCache = !error
  return notificationsTableCache
}

/** Migration 011 / 020 — notifications.account_type (or legacy role_context) */
export async function hasNotificationAccountSeparation(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (notificationRoleContextCache !== null) return notificationRoleContextCache

  const { error: accountError } = await requireSupabase()
    .from('notifications')
    .select('account_type')
    .limit(0)
  if (!accountError) {
    notificationRoleContextCache = true
    return true
  }

  const { error: legacyError } = await requireSupabase()
    .from('notifications')
    .select('role_context')
    .limit(0)
  notificationRoleContextCache = !legacyError
  return notificationRoleContextCache
}

/** @deprecated Use hasNotificationAccountSeparation */
export const hasNotificationRoleContext = hasNotificationAccountSeparation

/** Migration 009 — brand_profiles.banner_url */
export async function hasBrandBannerColumn(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (brandBannerColumnCache !== null) return brandBannerColumnCache

  const { error } = await requireSupabase().from('brand_profiles').select('banner_url').limit(0)
  brandBannerColumnCache = !error
  return brandBannerColumnCache
}

/** Migration 007 — creator_posts */
export async function hasCreatorPostsTable(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (portfolioTablesCache !== null) return portfolioTablesCache

  const { error } = await requireSupabase().from('creator_posts').select('id').limit(0)
  portfolioTablesCache = !error
  return portfolioTablesCache
}

/** @deprecated Use hasCreatorPostsTable */
export const hasPortfolioTables = hasCreatorPostsTable

/** Migration 002 — campaigns.platform */
export async function hasCampaignPlatformColumn(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (platformColumnCache !== null) return platformColumnCache

  const { error } = await requireSupabase().from('campaigns').select('platform').limit(0)
  platformColumnCache = !error
  return platformColumnCache
}

/** Migration 005 — profiles.primary_mode */
export async function hasPrimaryModeColumn(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false
  if (primaryModeColumnCache !== null) return primaryModeColumnCache

  const { error } = await requireSupabase().from('profiles').select('primary_mode').limit(0)
  primaryModeColumnCache = !error
  return primaryModeColumnCache
}

export function resetSchemaCache() {
  currencyColumnsCache = null
  campaignSystemCache = null
  applicationSystemCache = null
  primaryModeColumnCache = null
  platformColumnCache = null
  portfolioColumnsCache = null
  portfolioTablesCache = null
  brandBannerColumnCache = null
  notificationsTableCache = null
  notificationRoleContextCache = null
  collaborationTablesCache = null
  collaborationCompletionsCache = null
  creatorSocialColumnsCache = null
}

/** Strip brand banner when migration 009 has not been applied. */
export function stripBrandBannerFieldsIfNeeded<T extends Record<string, unknown>>(
  updates: T,
  migrated: boolean,
): T {
  if (migrated) return updates
  const { banner_url, ...rest } = updates as T & { banner_url?: unknown }
  return rest as T
}

export function resetCurrencyColumnsCache() {
  resetSchemaCache()
}

/** Strip country fields when the DB schema has not been migrated yet. */
export function stripCountryFieldsIfNeeded<T extends Record<string, unknown>>(
  updates: T,
  migrated: boolean,
): T {
  if (migrated) return updates
  const { country, preferred_currency, currency, ...rest } = updates as T & {
    country?: unknown
    preferred_currency?: unknown
    currency?: unknown
  }
  return rest as T
}

/** Strip portfolio fields when migration 006 has not been applied. */
export function stripPortfolioFieldsIfNeeded<T extends Record<string, unknown>>(
  updates: T,
  migrated: boolean,
): T {
  if (migrated) return updates
  const { banner_url, average_views, average_likes, engagement_rate, ...rest } = updates as T & {
    banner_url?: unknown
    average_views?: unknown
    average_likes?: unknown
    engagement_rate?: unknown
  }
  return rest as T
}

export function normalizeCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: row.id as string,
    brand_id: (row.brand_id ?? row.brand_user_id) as string,
    title: row.title as string,
    category: row.category as string,
    country: (row.country as string | null) ?? null,
    currency: (row.currency as string | null) ?? null,
    platform: (row.platform as string | null) ?? null,
    budget: (row.budget as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    requirements: Array.isArray(row.requirements) ? (row.requirements as string[]) : [],
    status: row.status as CampaignStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export function normalizeApplication(
  row: Record<string, unknown>,
  brandIdFallback?: string,
): Application {
  return {
    id: row.id as string,
    campaign_id: row.campaign_id as string,
    creator_id: (row.creator_id ?? row.creator_user_id) as string,
    brand_id: (row.brand_id ?? brandIdFallback ?? '') as string,
    message: (row.message ?? row.motivation) as string | null,
    portfolio_link: (row.portfolio_link as string | null) ?? null,
    status: row.status as ApplicationStatus,
    brand_marked_complete_at: (row.brand_marked_complete_at as string | null) ?? null,
    creator_confirmed_at: (row.creator_confirmed_at as string | null) ?? null,
    review_requested_at: (row.review_requested_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export function toCampaignWritePayload(
  campaign: Record<string, unknown>,
  campaignV2: boolean,
  currencyMigrated: boolean,
  platformMigrated: boolean,
): Record<string, unknown> {
  let payload = { ...campaign }
  if (!currencyMigrated) {
    payload = stripCountryFieldsIfNeeded(payload, false)
  }
  if (!platformMigrated && 'platform' in payload) {
    const { platform, ...rest } = payload
    payload = rest
  }
  if (!campaignV2 && payload.brand_id != null) {
    const { brand_id, ...rest } = payload
    return { ...rest, brand_user_id: brand_id }
  }
  return payload
}

export function toApplicationWritePayload(
  application: {
    campaign_id: string
    creator_id: string
    brand_id: string
    message: string | null
    portfolio_link: string | null
  },
  applicationV2: boolean,
): Record<string, unknown> {
  if (applicationV2) return application

  return {
    campaign_id: application.campaign_id,
    creator_user_id: application.creator_id,
    motivation: application.message,
    portfolio_link: application.portfolio_link,
  }
}

export async function fetchCampaignIdsForBrand(brandId: string): Promise<string[]> {
  const campaignV2 = await hasCampaignSystemV2()
  const column = campaignV2 ? 'brand_id' : 'brand_user_id'
  const { data, error } = await requireSupabase()
    .from('campaigns')
    .select('id')
    .eq(column, brandId)
  if (error) throw error
  return (data ?? []).map((c) => c.id)
}
