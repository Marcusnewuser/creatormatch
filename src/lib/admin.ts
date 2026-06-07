import { requireSupabase } from './supabase'
import { attachBrandProfiles } from './campaigns'
import { countAllCompletedCollaborations } from './collaboration-completions'
import { isActiveCollaboration } from './collaboration-workflow'
import { countCompletedCollaborations } from './applications'
import { hasCollaborationCompletionsTable } from './schema'
import type {
  Application,
  ApplicationStatus,
  BrandProfile,
  Campaign,
  CampaignWithBrand,
  CreatorProfile,
  Profile,
  UserRole,
} from '../types/database'

export type ReportType = 'fake_brand' | 'fake_creator' | 'spam' | 'abuse'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface AdminReport {
  id: string
  reporter_id: string
  reported_user_id: string | null
  reported_campaign_id: string | null
  report_type: ReportType
  description: string | null
  status: ReportStatus
  admin_notes: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

export interface AdminDashboardStats {
  totalUsers: number
  totalCreators: number
  totalBrands: number
  totalCampaigns: number
  totalApplications: number
  activeCollaborations: number
  completedCollaborations: number
  messagesSent: number
  growth: {
    users: number
    creators: number
    brands: number
    campaigns: number
    applications: number
    collaborations: number
    messages: number
  }
}

export interface AdminUserRow {
  id: string
  email: string
  role: UserRole | null
  roleLabel: string
  name: string
  avatarUrl: string | null
  country: string | null
  isSuspended: boolean
  hasCreator: boolean
  hasBrand: boolean
  createdAt: string
}

export interface AdminCreatorRow {
  id: string
  userId: string
  fullName: string
  avatarUrl: string | null
  country: string | null
  totalPosts: number
  totalApplications: number
  totalCollaborations: number
  isSuspended: boolean
  createdAt: string
}

export interface AdminBrandRow {
  id: string
  userId: string
  companyName: string
  logoUrl: string | null
  industry: string | null
  country: string | null
  activeCampaigns: number
  totalApplications: number
  isSuspended: boolean
  createdAt: string
}

export interface AdminCampaignRow extends CampaignWithBrand {
  applicationsCount: number
}

export interface AdminApplicationRow extends Application {
  creatorName: string
  brandName: string
  campaignTitle: string
}

export interface AdminCollaborationRow {
  id: string
  applicationId: string
  creatorName: string
  brandName: string
  campaignTitle: string
  status: ApplicationStatus
  createdAt: string
}

export interface AdminAnalytics {
  today: { users: number; campaigns: number; applications: number }
  last7Days: { users: number; campaigns: number; applications: number }
  last30Days: { users: number; campaigns: number; applications: number }
  charts: {
    userGrowth: { label: string; value: number }[]
    campaignGrowth: { label: string; value: number }[]
    applicationGrowth: { label: string; value: number }[]
  }
}

export interface AdminSearchResult {
  users: { id: string; label: string; subtitle: string; href: string }[]
  creators: { id: string; label: string; subtitle: string; href: string }[]
  brands: { id: string; label: string; subtitle: string; href: string }[]
  campaigns: { id: string; label: string; subtitle: string; href: string }[]
}

function growthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

async function countSince(table: string, since: string, column = 'created_at'): Promise<number> {
  const { count, error } = await requireSupabase()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte(column, since)
  if (error) throw error
  return count ?? 0
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const d30 = daysAgoIso(30)
  const d60 = daysAgoIso(60)

  const [
    profiles,
    creators,
    brands,
    campaigns,
    applications,
    messages,
    appsAll,
    users30,
    usersPrev30,
    creators30,
    creatorsPrev30,
    brands30,
    brandsPrev30,
    campaigns30,
    campaignsPrev30,
    apps30,
    appsPrev30,
    msgs30,
    msgsPrev30,
  ] = await Promise.all([
    requireSupabase().from('profiles').select('*', { count: 'exact', head: true }),
    requireSupabase().from('creator_profiles').select('*', { count: 'exact', head: true }),
    requireSupabase().from('brand_profiles').select('*', { count: 'exact', head: true }),
    requireSupabase().from('campaigns').select('*', { count: 'exact', head: true }),
    requireSupabase().from('applications').select('*', { count: 'exact', head: true }),
    requireSupabase().from('messages').select('*', { count: 'exact', head: true }),
    requireSupabase().from('applications').select('status'),
    countSince('profiles', d30),
    requireSupabase().from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    countSince('creator_profiles', d30),
    requireSupabase().from('creator_profiles').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    countSince('brand_profiles', d30),
    requireSupabase().from('brand_profiles').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    countSince('campaigns', d30),
    requireSupabase().from('campaigns').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    countSince('applications', d30),
    requireSupabase().from('applications').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    countSince('messages', d30),
    requireSupabase().from('messages').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
  ])

  const errors = [profiles, creators, brands, campaigns, applications, messages, appsAll].filter((r) => r.error)
  if (errors[0]?.error) throw errors[0].error

  const appRows = appsAll.data ?? []
  const activeCollaborations = appRows.filter((a) => isActiveCollaboration(a.status as ApplicationStatus)).length
  const completedCollaborations = (await hasCollaborationCompletionsTable())
    ? await countAllCompletedCollaborations()
    : appRows.filter((a) => a.status === 'completed').length

  const active30 = await countSince('applications', d30)
  const activePrev = (appsPrev30 as { count: number | null }).count ?? 0

  return {
    totalUsers: profiles.count ?? 0,
    totalCreators: creators.count ?? 0,
    totalBrands: brands.count ?? 0,
    totalCampaigns: campaigns.count ?? 0,
    totalApplications: applications.count ?? 0,
    activeCollaborations,
    completedCollaborations,
    messagesSent: messages.count ?? 0,
    growth: {
      users: growthPercent(users30, (usersPrev30 as { count: number | null }).count ?? 0),
      creators: growthPercent(creators30, (creatorsPrev30 as { count: number | null }).count ?? 0),
      brands: growthPercent(brands30, (brandsPrev30 as { count: number | null }).count ?? 0),
      campaigns: growthPercent(campaigns30, (campaignsPrev30 as { count: number | null }).count ?? 0),
      applications: growthPercent(apps30, activePrev),
      collaborations: growthPercent(active30, activePrev),
      messages: growthPercent(msgs30, (msgsPrev30 as { count: number | null }).count ?? 0),
    },
  }
}

function resolveUserRoleLabel(
  profile: Profile,
  hasCreator: boolean,
  hasBrand: boolean,
): string {
  if (profile.role === 'admin') return 'Admin'
  if (hasCreator && hasBrand) return 'Creator & Brand'
  if (hasCreator) return 'Creator'
  if (hasBrand) return 'Brand'
  if (profile.role === 'creator') return 'Creator'
  if (profile.role === 'brand') return 'Brand'
  return 'User'
}

export async function fetchAdminUsers(options?: {
  search?: string
  roleFilter?: 'all' | 'creator' | 'brand' | 'admin'
}): Promise<AdminUserRow[]> {
  const { data: profiles, error } = await requireSupabase()
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error

  const ids = (profiles ?? []).map((p) => p.id)
  const [{ data: creators }, { data: brands }] = await Promise.all([
    ids.length
      ? requireSupabase().from('creator_profiles').select('user_id, full_name, avatar_url, country').in('user_id', ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? requireSupabase().from('brand_profiles').select('user_id, company_name, logo_url, country').in('user_id', ids)
      : Promise.resolve({ data: [] }),
  ])

  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c]))
  const brandMap = new Map((brands ?? []).map((b) => [b.user_id, b]))

  let rows: AdminUserRow[] = (profiles ?? []).map((p) => {
    const c = creatorMap.get(p.id)
    const b = brandMap.get(p.id)
    const hasCreator = Boolean(c)
    const hasBrand = Boolean(b)
    const suspended = Boolean((p as Profile & { is_suspended?: boolean }).is_suspended)
    return {
      id: p.id,
      email: p.email,
      role: p.role,
      roleLabel: resolveUserRoleLabel(p, hasCreator, hasBrand),
      name: c?.full_name ?? b?.company_name ?? p.email,
      avatarUrl: c?.avatar_url ?? b?.logo_url ?? null,
      country: c?.country ?? b?.country ?? null,
      isSuspended: suspended,
      hasCreator,
      hasBrand,
      createdAt: p.created_at,
    }
  })

  const search = options?.search?.trim().toLowerCase()
  if (search) {
    rows = rows.filter(
      (r) =>
        r.email.toLowerCase().includes(search) ||
        r.name.toLowerCase().includes(search) ||
        (r.country?.toLowerCase().includes(search) ?? false),
    )
  }

  const filter = options?.roleFilter ?? 'all'
  if (filter === 'admin') rows = rows.filter((r) => r.role === 'admin')
  if (filter === 'creator') rows = rows.filter((r) => r.hasCreator)
  if (filter === 'brand') rows = rows.filter((r) => r.hasBrand)

  return rows
}

export async function fetchAdminUserDetail(userId: string) {
  const [{ data: profile }, { data: creator }, { data: brand }] = await Promise.all([
    requireSupabase().from('profiles').select('*').eq('id', userId).maybeSingle(),
    requireSupabase().from('creator_profiles').select('*').eq('user_id', userId).maybeSingle(),
    requireSupabase().from('brand_profiles').select('*').eq('user_id', userId).maybeSingle(),
  ])
  if (!profile) return null

  const [{ count: apps }, { count: posts }, { count: campaigns }] = await Promise.all([
    requireSupabase().from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
    requireSupabase().from('creator_posts').select('*', { count: 'exact', head: true }).eq('creator_id', userId),
    requireSupabase().from('campaigns').select('*', { count: 'exact', head: true }).eq('brand_id', userId),
  ])

  return {
    profile: profile as Profile & { is_suspended?: boolean },
    creator: creator as CreatorProfile | null,
    brand: brand as BrandProfile | null,
    stats: {
      applications: apps ?? 0,
      posts: posts ?? 0,
      campaigns: campaigns ?? 0,
    },
  }
}

export async function adminSetUserSuspended(userId: string, suspended: boolean): Promise<void> {
  const { error } = await requireSupabase()
    .from('profiles')
    .update({ is_suspended: suspended })
    .eq('id', userId)
  if (error) throw error
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await requireSupabase().from('profiles').delete().eq('id', userId)
  if (error) throw error
}

export async function fetchAdminCreators(search?: string): Promise<AdminCreatorRow[]> {
  const { data, error } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error

  const rows: AdminCreatorRow[] = []
  for (const c of data ?? []) {
    const [{ count: posts }, { count: apps }, { data: profile }] = await Promise.all([
      requireSupabase().from('creator_posts').select('*', { count: 'exact', head: true }).eq('creator_id', c.user_id),
      requireSupabase().from('applications').select('*', { count: 'exact', head: true }).eq('creator_id', c.user_id),
      requireSupabase().from('profiles').select('is_suspended').eq('id', c.user_id).maybeSingle(),
    ])
    const completedCount = await countCompletedCollaborations(c.user_id, 'creator')

    rows.push({
      id: c.id,
      userId: c.user_id,
      fullName: c.full_name ?? 'Unnamed Creator',
      avatarUrl: c.avatar_url,
      country: c.country,
      totalPosts: posts ?? 0,
      totalApplications: apps ?? 0,
      totalCollaborations: completedCount,
      isSuspended: Boolean(profile?.is_suspended),
      createdAt: c.created_at,
    })
  }

  const q = search?.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.fullName.toLowerCase().includes(q) || (r.country?.toLowerCase().includes(q) ?? false),
  )
}

export async function fetchAdminBrands(search?: string): Promise<AdminBrandRow[]> {
  const { data, error } = await requireSupabase()
    .from('brand_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error

  const rows: AdminBrandRow[] = []
  for (const b of data ?? []) {
    const [{ count: active }, { count: apps }, { data: profile }] = await Promise.all([
      requireSupabase()
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('brand_id', b.user_id)
        .eq('status', 'active'),
      requireSupabase().from('applications').select('*', { count: 'exact', head: true }).eq('brand_id', b.user_id),
      requireSupabase().from('profiles').select('is_suspended').eq('id', b.user_id).maybeSingle(),
    ])
    rows.push({
      id: b.id,
      userId: b.user_id,
      companyName: b.company_name ?? 'Unnamed Brand',
      logoUrl: b.logo_url,
      industry: b.industry,
      country: b.country,
      activeCampaigns: active ?? 0,
      totalApplications: apps ?? 0,
      isSuspended: Boolean(profile?.is_suspended),
      createdAt: b.created_at,
    })
  }

  const q = search?.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.companyName.toLowerCase().includes(q) ||
      (r.industry?.toLowerCase().includes(q) ?? false) ||
      (r.country?.toLowerCase().includes(q) ?? false),
  )
}

export async function fetchAdminCampaigns(options?: {
  search?: string
  status?: string
}): Promise<AdminCampaignRow[]> {
  let query = requireSupabase().from('campaigns').select('*').order('created_at', { ascending: false }).limit(200)
  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  const { data, error } = await query
  if (error) throw error

  const withBrands = await attachBrandProfiles(data ?? [])
  const rows: AdminCampaignRow[] = []

  for (const c of withBrands) {
    const { count } = await requireSupabase()
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', c.id)
    rows.push({ ...c, applicationsCount: count ?? 0 })
  }

  const q = options?.search?.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      (r.brand_profiles?.company_name?.toLowerCase().includes(q) ?? false),
  )
}

export async function adminUpdateCampaign(
  id: string,
  updates: Partial<Pick<Campaign, 'title' | 'status' | 'budget' | 'description'>>,
): Promise<void> {
  const { error } = await requireSupabase().from('campaigns').update(updates).eq('id', id)
  if (error) throw error
}

export async function adminDeleteCampaign(id: string): Promise<void> {
  const { error } = await requireSupabase().from('campaigns').delete().eq('id', id)
  if (error) throw error
}

export async function fetchAdminApplications(statusFilter?: string): Promise<AdminApplicationRow[]> {
  let query = requireSupabase().from('applications').select('*').order('created_at', { ascending: false }).limit(200)
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  const { data, error } = await query
  if (error) throw error

  const rows: AdminApplicationRow[] = []
  for (const app of data ?? []) {
    const [{ data: creator }, { data: brand }, { data: campaign }] = await Promise.all([
      requireSupabase().from('creator_profiles').select('full_name').eq('user_id', app.creator_id).maybeSingle(),
      requireSupabase().from('brand_profiles').select('company_name').eq('user_id', app.brand_id).maybeSingle(),
      requireSupabase().from('campaigns').select('title').eq('id', app.campaign_id).maybeSingle(),
    ])
    rows.push({
      ...app,
      creatorName: creator?.full_name ?? 'Creator',
      brandName: brand?.company_name ?? 'Brand',
      campaignTitle: campaign?.title ?? 'Campaign',
    })
  }
  return rows
}

export async function fetchAdminCollaborations(): Promise<AdminCollaborationRow[]> {
  const { data, error } = await requireSupabase()
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error

  const rows: AdminCollaborationRow[] = []
  for (const conv of data ?? []) {
    const { data: app } = await requireSupabase()
      .from('applications')
      .select('*')
      .eq('id', conv.application_id)
      .maybeSingle()
    if (!app) continue

    const [{ data: creator }, { data: brand }, { data: campaign }] = await Promise.all([
      requireSupabase().from('creator_profiles').select('full_name').eq('user_id', conv.creator_id).maybeSingle(),
      requireSupabase().from('brand_profiles').select('company_name').eq('user_id', conv.brand_id).maybeSingle(),
      requireSupabase().from('campaigns').select('title').eq('id', app.campaign_id).maybeSingle(),
    ])

    rows.push({
      id: conv.id,
      applicationId: conv.application_id,
      creatorName: creator?.full_name ?? 'Creator',
      brandName: brand?.company_name ?? 'Brand',
      campaignTitle: campaign?.title ?? 'Campaign',
      status: app.status,
      createdAt: conv.created_at,
    })
  }
  return rows
}

export async function fetchAdminReports(statusFilter?: ReportStatus | 'all'): Promise<AdminReport[]> {
  let query = requireSupabase().from('reports').select('*').order('created_at', { ascending: false }).limit(200)
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AdminReport[]
}

export async function adminUpdateReport(
  id: string,
  updates: { status: ReportStatus; admin_notes?: string },
  adminId: string,
): Promise<void> {
  const { error } = await requireSupabase()
    .from('reports')
    .update({
      status: updates.status,
      admin_notes: updates.admin_notes ?? null,
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
    })
    .eq('id', id)
  if (error) throw error
}

export async function submitReport(input: {
  reporterId: string
  reportType: ReportType
  description?: string
  reportedUserId?: string
  reportedCampaignId?: string
}): Promise<void> {
  const { error } = await requireSupabase().from('reports').insert({
    reporter_id: input.reporterId,
    report_type: input.reportType,
    description: input.description ?? null,
    reported_user_id: input.reportedUserId ?? null,
    reported_campaign_id: input.reportedCampaignId ?? null,
  })
  if (error) throw error
}

function lastNDaysLabels(n: number): string[] {
  const labels: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return labels
}

async function dailyCounts(table: string, days: number): Promise<number[]> {
  const counts: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - i)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const { count, error } = await requireSupabase()
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
    if (error) throw error
    counts.push(count ?? 0)
  }
  return counts
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const d1 = daysAgoIso(1)
  const d7 = daysAgoIso(7)
  const d30 = daysAgoIso(30)

  const [usersToday, campaignsToday, appsToday, users7, campaigns7, apps7, users30, campaigns30, apps30] =
    await Promise.all([
      countSince('profiles', d1),
      countSince('campaigns', d1),
      countSince('applications', d1),
      countSince('profiles', d7),
      countSince('campaigns', d7),
      countSince('applications', d7),
      countSince('profiles', d30),
      countSince('campaigns', d30),
      countSince('applications', d30),
    ])

  const labels = lastNDaysLabels(7)
  const [userGrowth, campaignGrowth, applicationGrowth] = await Promise.all([
    dailyCounts('profiles', 7),
    dailyCounts('campaigns', 7),
    dailyCounts('applications', 7),
  ])

  return {
    today: { users: usersToday, campaigns: campaignsToday, applications: appsToday },
    last7Days: { users: users7, campaigns: campaigns7, applications: apps7 },
    last30Days: { users: users30, campaigns: campaigns30, applications: apps30 },
    charts: {
      userGrowth: labels.map((label, i) => ({ label, value: userGrowth[i] ?? 0 })),
      campaignGrowth: labels.map((label, i) => ({ label, value: campaignGrowth[i] ?? 0 })),
      applicationGrowth: labels.map((label, i) => ({ label, value: applicationGrowth[i] ?? 0 })),
    },
  }
}

export async function adminGlobalSearch(query: string): Promise<AdminSearchResult> {
  const q = query.trim()
  if (q.length < 2) {
    return { users: [], creators: [], brands: [], campaigns: [] }
  }

  const pattern = `%${q}%`

  const [{ data: profiles }, { data: creators }, { data: brands }, { data: campaigns }] =
    await Promise.all([
      requireSupabase().from('profiles').select('id, email').ilike('email', pattern).limit(8),
      requireSupabase()
        .from('creator_profiles')
        .select('user_id, full_name, country')
        .ilike('full_name', pattern)
        .limit(8),
      requireSupabase()
        .from('brand_profiles')
        .select('user_id, company_name, industry')
        .ilike('company_name', pattern)
        .limit(8),
      requireSupabase().from('campaigns').select('id, title, status').ilike('title', pattern).limit(8),
    ])

  return {
    users: (profiles ?? []).map((p) => ({
      id: p.id,
      label: p.email,
      subtitle: 'User account',
      href: `/admin/users/${p.id}`,
    })),
    creators: (creators ?? []).map((c) => ({
      id: c.user_id,
      label: c.full_name ?? 'Creator',
      subtitle: c.country ?? 'Creator profile',
      href: `/admin/users/${c.user_id}`,
    })),
    brands: (brands ?? []).map((b) => ({
      id: b.user_id,
      label: b.company_name ?? 'Brand',
      subtitle: b.industry ?? 'Brand profile',
      href: `/admin/users/${b.user_id}`,
    })),
    campaigns: (campaigns ?? []).map((c) => ({
      id: c.id,
      label: c.title,
      subtitle: c.status,
      href: `/admin/campaigns`,
    })),
  }
}

export async function adminDeleteCreatorProfile(userId: string): Promise<void> {
  const { error } = await requireSupabase().from('creator_profiles').delete().eq('user_id', userId)
  if (error) throw error
}

export async function adminDeleteBrandProfile(userId: string): Promise<void> {
  const { error } = await requireSupabase().from('brand_profiles').delete().eq('user_id', userId)
  if (error) throw error
}

/** @deprecated Use fetchAdminDashboardStats */
export async function fetchAdminStats() {
  const stats = await fetchAdminDashboardStats()
  return {
    creators: stats.totalCreators,
    brands: stats.totalBrands,
    campaigns: stats.totalCampaigns,
    applications: stats.totalApplications,
  }
}
