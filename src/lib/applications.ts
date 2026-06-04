import { requireSupabase } from './supabase'
import { attachBrandProfiles } from './campaigns'
import {
  fetchCampaignIdsForBrand,
  hasApplicationSystemV2,
  normalizeApplication,
  normalizeCampaign,
  toApplicationWritePayload,
} from './schema'
import type {
  Application,
  ApplicationStatus,
  ApplicationWithCampaign,
  ApplicationWithCreator,
  UserRole,
} from '../types/database'

export type ApplicationInsert = Pick<
  Application,
  'campaign_id' | 'creator_id' | 'brand_id' | 'message' | 'portfolio_link'
>

export function applicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'accepted':
      return 'Accepted'
    case 'rejected':
      return 'Rejected'
    case 'in_progress':
      return 'In Progress'
    case 'content_submitted':
      return 'Content Submitted'
    case 'approved':
      return 'Approved'
    case 'pending_completion':
      return 'Awaiting Confirmation'
    case 'completed':
      return 'Completed'
  }
}

export type ApplicationStatusBadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline'

export function applicationStatusBadgeVariant(status: ApplicationStatus): ApplicationStatusBadgeVariant {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'accepted':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'in_progress':
      return 'primary'
    case 'content_submitted':
      return 'warning'
    case 'approved':
      return 'success'
    case 'pending_completion':
      return 'warning'
    case 'completed':
      return 'primary'
  }
}

export function countByStatus(items: { status: ApplicationStatus }[]) {
  return {
    pending: items.filter((i) => i.status === 'pending').length,
    accepted: items.filter((i) => i.status === 'accepted').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    content_submitted: items.filter((i) => i.status === 'content_submitted').length,
    approved: items.filter((i) => i.status === 'approved').length,
    pending_completion: items.filter((i) => i.status === 'pending_completion').length,
    completed: items.filter((i) => i.status === 'completed').length,
    total: items.length,
  }
}

export async function hasAppliedToCampaign(creatorId: string, campaignId: string) {
  const applicationV2 = await hasApplicationSystemV2()
  const column = applicationV2 ? 'creator_id' : 'creator_user_id'
  const { data, error } = await requireSupabase()
    .from('applications')
    .select('id')
    .eq(column, creatorId)
    .eq('campaign_id', campaignId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function submitApplication(application: ApplicationInsert): Promise<Application> {
  const alreadyApplied = await hasAppliedToCampaign(application.creator_id, application.campaign_id)
  if (alreadyApplied) {
    throw new Error('You have already applied to this campaign.')
  }

  const applicationV2 = await hasApplicationSystemV2()
  const payload = toApplicationWritePayload(application, applicationV2)

  const { data, error } = await requireSupabase()
    .from('applications')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already applied to this campaign.')
    }
    throw error
  }
  return normalizeApplication(data, application.brand_id)
}

export async function withdrawApplication(id: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('status', 'pending')
  if (error) throw error
}

async function attachCreatorProfiles(
  applications: Application[],
): Promise<ApplicationWithCreator[]> {
  const creatorIds = [...new Set(applications.map((a) => a.creator_id))]
  const { data: creators, error } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .in('user_id', creatorIds)
  if (error) throw error

  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c]))
  return applications.map((app) => ({
    ...app,
    creator_profiles: creatorMap.get(app.creator_id) ?? null,
  }))
}

export async function fetchCreatorApplications(creatorId: string): Promise<ApplicationWithCampaign[]> {
  const applicationV2 = await hasApplicationSystemV2()
  const creatorColumn = applicationV2 ? 'creator_id' : 'creator_user_id'

  const { data: applications, error } = await requireSupabase()
    .from('applications')
    .select('*')
    .eq(creatorColumn, creatorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!applications?.length) return []

  const campaignIds = [...new Set(applications.map((a) => a.campaign_id))]
  const { data: campaigns, error: campaignError } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .in('id', campaignIds)
  if (campaignError) throw campaignError

  const campaignsWithBrand = await attachBrandProfiles(campaigns ?? [])
  const campaignMap = new Map(campaignsWithBrand.map((c) => [c.id, c]))

  return applications.map((row) => {
    const campaign = campaignMap.get(row.campaign_id)
    const app = normalizeApplication(row, campaign?.brand_id)
    return {
      ...app,
      campaigns: campaign!,
    }
  })
}

export async function fetchCampaignApplications(campaignId: string): Promise<ApplicationWithCreator[]> {
  const { data: applications, error } = await requireSupabase()
    .from('applications')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!applications?.length) return []

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  const normalized = applications.map((row) => normalizeApplication(row, brandId))
  return attachCreatorProfiles(normalized)
}

export async function fetchBrandApplications(brandId: string): Promise<ApplicationWithCreator[]> {
  const applicationV2 = await hasApplicationSystemV2()

  if (applicationV2) {
    const { data: applications, error } = await requireSupabase()
      .from('applications')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
    if (error) throw error
    if (!applications?.length) return []
    return attachCreatorProfiles(applications.map((row) => normalizeApplication(row, brandId)))
  }

  const campaignIds = await fetchCampaignIdsForBrand(brandId)
  if (!campaignIds.length) return []

  const { data: applications, error } = await requireSupabase()
    .from('applications')
    .select('*')
    .in('campaign_id', campaignIds)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!applications?.length) return []

  return attachCreatorProfiles(applications.map((row) => normalizeApplication(row, brandId)))
}

export async function fetchApplicationById(id: string): Promise<ApplicationWithCreator | null> {
  const { data: application, error } = await requireSupabase()
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!application) return null

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', application.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  const normalized = normalizeApplication(application, brandId)

  const { data: creator, error: creatorError } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .eq('user_id', normalized.creator_id)
    .maybeSingle()
  if (creatorError) throw creatorError

  return { ...normalized, creator_profiles: creator }
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<Application> {
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', data.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  return normalizeApplication(data, brandId)
}

export async function startCollaboration(id: string): Promise<Application> {
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({ status: 'in_progress' })
    .eq('id', id)
    .eq('status', 'accepted')
    .select()
    .single()
  if (error) throw error

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', data.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  return normalizeApplication(data, brandId)
}

export async function markCollaborationComplete(id: string): Promise<Application> {
  const now = new Date().toISOString()
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({
      status: 'completed',
      completed_at: now,
      brand_marked_complete_at: now,
      creator_confirmed_at: now,
    })
    .eq('id', id)
    .eq('status', 'approved')
    .select()
    .single()
  if (error) throw error

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', data.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  return normalizeApplication(data, brandId)
}

export async function confirmCollaborationComplete(id: string): Promise<Application> {
  const now = new Date().toISOString()
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({
      status: 'completed',
      creator_confirmed_at: now,
      completed_at: now,
    })
    .eq('id', id)
    .eq('status', 'pending_completion')
    .select()
    .single()
  if (error) throw error

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', data.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  return normalizeApplication(data, brandId)
}

export async function requestCollaborationReview(id: string): Promise<Application> {
  const now = new Date().toISOString()
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({ review_requested_at: now })
    .eq('id', id)
    .eq('status', 'pending_completion')
    .select()
    .single()
  if (error) throw error

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', data.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  return normalizeApplication(data, brandId)
}

export async function countCompletedCollaborations(userId: string, role: 'creator' | 'brand'): Promise<number> {
  const applicationV2 = await hasApplicationSystemV2()

  if (role === 'creator') {
    const column = applicationV2 ? 'creator_id' : 'creator_user_id'
    const { count, error } = await requireSupabase()
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq(column, userId)
      .eq('status', 'completed')
    if (error) throw error
    return count ?? 0
  }

  if (applicationV2) {
    const { count, error } = await requireSupabase()
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', userId)
      .eq('status', 'completed')
    if (error) throw error
    return count ?? 0
  }

  const campaignIds = await fetchCampaignIdsForBrand(userId)
  if (!campaignIds.length) return 0

  const { count, error } = await requireSupabase()
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('campaign_id', campaignIds)
    .eq('status', 'completed')
  if (error) throw error
  return count ?? 0
}

export async function countApplicationsByStatus(userId: string, role: UserRole) {
  if (role === 'creator') {
    const applicationV2 = await hasApplicationSystemV2()
    const column = applicationV2 ? 'creator_id' : 'creator_user_id'
    const { data, error } = await requireSupabase()
      .from('applications')
      .select('status')
      .eq(column, userId)
    if (error) throw error
    return countByStatus(data ?? [])
  }

  const applicationV2 = await hasApplicationSystemV2()
  if (applicationV2) {
    const { data, error } = await requireSupabase()
      .from('applications')
      .select('status')
      .eq('brand_id', userId)
    if (error) throw error
    return countByStatus(data ?? [])
  }

  const campaignIds = await fetchCampaignIdsForBrand(userId)
  if (!campaignIds.length) return countByStatus([])

  const { data, error } = await requireSupabase()
    .from('applications')
    .select('status')
    .in('campaign_id', campaignIds)
  if (error) throw error
  return countByStatus(data ?? [])
}

export async function fetchBrandApplicationStats(brandId: string) {
  const stats = await countApplicationsByStatus(brandId, 'brand')
  const completedCollaborations = await countCompletedCollaborations(brandId, 'brand')
  return {
    total: stats.total,
    pending: stats.pending,
    accepted: stats.accepted,
    rejected: stats.rejected,
    in_progress: stats.in_progress,
    content_submitted: stats.content_submitted,
    approved: stats.approved,
    pending_completion: stats.pending_completion,
    completed: stats.completed,
    completedCollaborations,
  }
}

export async function fetchRecentApplicantsForBrand(brandId: string, limit = 5) {
  const applicationV2 = await hasApplicationSystemV2()

  let applications: Record<string, unknown>[] = []

  if (applicationV2) {
    const { data, error } = await requireSupabase()
      .from('applications')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    applications = data ?? []
  } else {
    const campaignIds = await fetchCampaignIdsForBrand(brandId)
    if (!campaignIds.length) return []

    const { data, error } = await requireSupabase()
      .from('applications')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    applications = data ?? []
  }

  if (!applications.length) return []

  const campaignIds = [...new Set(applications.map((a) => a.campaign_id as string))]
  const { data: campaigns, error: campaignError } = await requireSupabase()
    .from('campaigns')
    .select('id, title')
    .in('id', campaignIds)
  if (campaignError) throw campaignError

  const normalized = applications.map((row) => normalizeApplication(row, brandId))
  const withCreators = await attachCreatorProfiles(normalized)
  const campaignMap = new Map((campaigns ?? []).map((c) => [c.id, c]))

  return withCreators.map((app) => ({
    ...app,
    campaigns: campaignMap.get(app.campaign_id),
  }))
}

export async function fetchRecentActivity(limit = 10) {
  const { data: applications, error } = await requireSupabase()
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  if (!applications?.length) return []

  const normalized = applications.map((row) => normalizeApplication(row))
  const creatorIds = [...new Set(normalized.map((a) => a.creator_id))]
  const campaignIds = [...new Set(normalized.map((a) => a.campaign_id))]

  const [{ data: creators }, { data: campaigns }] = await Promise.all([
    requireSupabase().from('creator_profiles').select('user_id, full_name').in('user_id', creatorIds),
    requireSupabase().from('campaigns').select('id, title').in('id', campaignIds),
  ])

  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c.full_name]))
  const campaignMap = new Map((campaigns ?? []).map((c) => [c.id, c.title]))

  return normalized.map((app) => ({
    id: app.id,
    text: `${creatorMap.get(app.creator_id) ?? 'A creator'} applied to ${campaignMap.get(app.campaign_id) ?? 'a campaign'}`,
    time: app.created_at,
  }))
}
