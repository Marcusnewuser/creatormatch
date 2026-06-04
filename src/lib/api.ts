import { requireSupabase } from './supabase'
import { attachBrandProfiles } from './campaigns'
import {
  hasBrandBannerColumn,
  hasCurrencyColumns,
  hasPrimaryModeColumn,
  hasPortfolioColumns,
  stripBrandBannerFieldsIfNeeded,
  stripCountryFieldsIfNeeded,
  stripPortfolioFieldsIfNeeded,
} from './schema'
import type {
  AppMode,
  BrandProfile,
  CreatorProfile,
  Profile,
} from '../types/database'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase().from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchAccountProfiles(userId: string) {
  const [profile, creatorProfile, brandProfile] = await Promise.all([
    fetchProfile(userId),
    fetchCreatorProfile(userId),
    fetchBrandProfile(userId),
  ])
  return { profile, creatorProfile, brandProfile }
}

export async function setPrimaryMode(userId: string, mode: AppMode): Promise<Profile> {
  const hasColumn = await hasPrimaryModeColumn()
  const updates = hasColumn ? { primary_mode: mode } : { role: mode }

  const { data, error } = await requireSupabase()
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function ensureCreatorProfile(userId: string): Promise<CreatorProfile> {
  const existing = await fetchCreatorProfile(userId)
  if (existing) return existing

  const { data, error } = await requireSupabase()
    .from('creator_profiles')
    .insert({ user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function ensureBrandProfile(userId: string): Promise<BrandProfile> {
  const existing = await fetchBrandProfile(userId)
  if (existing) return existing

  const { data, error } = await requireSupabase()
    .from('brand_profiles')
    .insert({ user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

/** First-time onboarding: set primary mode and create the initial profile. */
export async function completeOnboarding(
  userId: string,
  mode: AppMode,
  fullName?: string,
): Promise<void> {
  await setPrimaryMode(userId, mode)
  if (mode === 'creator') {
    await updateCreatorProfile(userId, { full_name: fullName || null })
  } else {
    await updateBrandProfile(userId, { company_name: fullName || null })
  }
}

export async function fetchCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  const { data, error } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchCreatorProfileById(id: string): Promise<CreatorProfile | null> {
  const { data, error } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateCreatorProfile(
  userId: string,
  updates: Partial<Omit<CreatorProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<CreatorProfile> {
  const [currencyMigrated, portfolioMigrated] = await Promise.all([
    hasCurrencyColumns(),
    hasPortfolioColumns(),
  ])
  let payload = stripCountryFieldsIfNeeded(updates, currencyMigrated)
  payload = stripPortfolioFieldsIfNeeded(payload, portfolioMigrated)

  const { data: existing } = await requireSupabase()
    .from('creator_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    const { data, error } = await requireSupabase()
      .from('creator_profiles')
      .insert({ user_id: userId, ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await requireSupabase()
    .from('creator_profiles')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchBrandProfile(userId: string): Promise<BrandProfile | null> {
  const { data, error } = await requireSupabase()
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateBrandProfile(
  userId: string,
  updates: Partial<Omit<BrandProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<BrandProfile> {
  const [currencyMigrated, bannerMigrated] = await Promise.all([
    hasCurrencyColumns(),
    hasBrandBannerColumn(),
  ])
  let payload = stripCountryFieldsIfNeeded(updates, currencyMigrated)
  payload = stripBrandBannerFieldsIfNeeded(payload, bannerMigrated)

  const { data: existing } = await requireSupabase()
    .from('brand_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    const { data, error } = await requireSupabase()
      .from('brand_profiles')
      .insert({ user_id: userId, ...payload })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await requireSupabase()
    .from('brand_profiles')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export {
  fetchActiveCampaigns,
  fetchRecentCampaigns,
  fetchCampaignById,
  fetchBrandCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  fetchBrandCampaignStats,
  countBrandActiveCampaigns,
  countCampaignApplicants,
  statusLabel,
} from './campaigns'
export type { CampaignInsert, CampaignUpdate } from './campaigns'

export {
  hasAppliedToCampaign,
  submitApplication,
  withdrawApplication,
  fetchCreatorApplications,
  fetchCampaignApplications,
  fetchBrandApplications,
  fetchApplicationById,
  updateApplicationStatus,
  startCollaboration,
  markCollaborationComplete,
  confirmCollaborationComplete,
  requestCollaborationReview,
  countCompletedCollaborations,
  countApplicationsByStatus,
  fetchBrandApplicationStats,
  fetchRecentApplicantsForBrand,
  fetchRecentActivity,
  applicationStatusLabel,
  applicationStatusBadgeVariant,
} from './applications'
export type { ApplicationInsert } from './applications'

export {
  fetchConversationsForUser,
  fetchConversationById,
  fetchConversationByApplication,
  fetchMessages,
  sendMessage,
  markConversationRead,
  fetchTotalUnreadMessages,
  fetchRecentMessagesForUser,
  subscribeToMessages,
  uploadCollaborationFile,
  validateCollaborationFile,
  approveApplicationContent,
  completeCollaboration,
  countActiveCollaborations,
  COLLABORATION_FILE_MAX_BYTES,
} from './collaborations'

export {
  fetchSubmissionsForApplication,
  createSubmission,
  isValidContentUrl,
} from './submissions'

export {
  COLLABORATION_TIMELINE_STEPS,
  getTimelineStepIndex,
  isActiveCollaboration,
  canAccessCollaborationChat,
} from './collaboration-workflow'

export {
  fetchCreatorPosts,
  fetchCreatorProfileWithPosts,
  fetchPostById,
  fetchPostWithCreator,
  createCreatorPost,
  updateCreatorPost,
  deleteCreatorPost,
  trackPostView,
  hasUserLikedPost,
  likePost,
  unlikePost,
  computePostStats,
  formatPostMetric,
} from './creator-posts'
export type { CreatorPostInsert } from './creator-posts'

/** @deprecated Use fetchCreatorProfileWithPosts */
export { fetchCreatorProfileWithPosts as fetchCreatorPortfolio } from './creator-posts'

export {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
  notificationTypeLabel,
  getNotificationLink,
} from './notifications'

export async function fetchAdminStats() {
  const [creators, brands, campaigns, applications] = await Promise.all([
    requireSupabase().from('creator_profiles').select('*', { count: 'exact', head: true }),
    requireSupabase().from('brand_profiles').select('*', { count: 'exact', head: true }),
    requireSupabase().from('campaigns').select('*', { count: 'exact', head: true }),
    requireSupabase().from('applications').select('*', { count: 'exact', head: true }),
  ])

  if (creators.error) throw creators.error
  if (brands.error) throw brands.error
  if (campaigns.error) throw campaigns.error
  if (applications.error) throw applications.error

  return {
    creators: creators.count ?? 0,
    brands: brands.count ?? 0,
    campaigns: campaigns.count ?? 0,
    applications: applications.count ?? 0,
  }
}

export async function uploadFile(
  bucket: 'avatars' | 'logos' | 'campaign-images' | 'portfolio' | 'collaboration-files',
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await requireSupabase().storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (uploadError) throw uploadError

  const { data } = requireSupabase().storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function fetchAdminList(type: 'creators' | 'brands' | 'campaigns' | 'applications') {
  switch (type) {
    case 'creators': {
      const { data, error } = await requireSupabase()
        .from('creator_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    }
    case 'brands': {
      const { data, error } = await requireSupabase()
        .from('brand_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    }
    case 'campaigns': {
      const { data, error } = await requireSupabase()
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return attachBrandProfiles(data ?? [])
    }
    case 'applications': {
      const { data, error } = await requireSupabase()
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data ?? []
    }
  }
}
