import { requireSupabase } from './supabase'
import { normalizeApplication, normalizeCampaign } from './schema'
import type {
  Application,
  Conversation,
  ConversationWithDetails,
  Message,
  MessageRoleContext,
} from '../types/database'
import type { AppMode } from './account-mode'

export function resolveMessageRole(
  activeMode: AppMode | null,
  hasCreatorProfile: boolean,
  hasBrandProfile: boolean,
): MessageRoleContext {
  if (activeMode === 'brand' && hasBrandProfile) return 'brand'
  if (activeMode === 'creator' && hasCreatorProfile) return 'creator'
  if (hasBrandProfile && !hasCreatorProfile) return 'brand'
  return 'creator'
}

export function canAccessConversationAsRole(
  conversation: Conversation,
  userId: string,
  role: MessageRoleContext,
): boolean {
  if (role === 'creator') {
    return conversation.creator_id === userId
  }
  return conversation.brand_id === userId
}

export const COLLABORATION_FILE_MAX_BYTES = 10 * 1024 * 1024

export const COLLABORATION_FILE_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export function validateCollaborationFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!COLLABORATION_FILE_TYPES[ext]) {
    return 'Supported: PDF, DOCX, XLSX, PNG, JPG, WEBP'
  }
  if (file.size > COLLABORATION_FILE_MAX_BYTES) {
    return 'File must be 10 MB or smaller'
  }
  return null
}

export async function uploadCollaborationFile(userId: string, file: File): Promise<string> {
  const validation = validateCollaborationFile(file)
  if (validation) throw new Error(validation)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await requireSupabase()
    .storage.from('collaboration-files')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (uploadError) throw uploadError

  const { data } = requireSupabase().storage.from('collaboration-files').getPublicUrl(path)
  return data.publicUrl
}

export async function fetchConversationByApplication(
  applicationId: string,
  userId: string,
  role: MessageRoleContext,
): Promise<Conversation | null> {
  let query = requireSupabase()
    .from('conversations')
    .select('*')
    .eq('application_id', applicationId)

  query = role === 'creator' ? query.eq('creator_id', userId) : query.eq('brand_id', userId)

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

export async function fetchConversationByIdForRole(
  id: string,
  userId: string,
  role: MessageRoleContext,
): Promise<Conversation | null> {
  const conv = await fetchConversationById(id)
  if (!conv || !canAccessConversationAsRole(conv, userId, role)) return null
  return conv
}

export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await requireSupabase()
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function attachConversationDetails(
  conversations: Conversation[],
  userId: string,
  role: MessageRoleContext,
): Promise<ConversationWithDetails[]> {
  if (!conversations.length) return []

  const appIds = conversations.map((c) => c.application_id)
  const otherIds = conversations.map((c) =>
    role === 'creator' ? c.brand_id : c.creator_id,
  )

  const [{ data: applications }, { data: creators }, { data: brands }] = await Promise.all([
    requireSupabase().from('applications').select('*').in('id', appIds),
    requireSupabase()
      .from('creator_profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', otherIds),
    requireSupabase()
      .from('brand_profiles')
      .select('user_id, company_name, logo_url')
      .in('user_id', otherIds),
  ])

  const campaignIds = [...new Set((applications ?? []).map((a) => a.campaign_id as string))]
  const { data: campaigns } = campaignIds.length
    ? await requireSupabase().from('campaigns').select('id, title').in('id', campaignIds)
    : { data: [] }

  const appMap = new Map(
    (applications ?? []).map((a) => [a.id as string, normalizeApplication(a)]),
  )

  const campaignTitleByApp = new Map<string, string>()
  const campaignMap = new Map((campaigns ?? []).map((c) => [c.id, c.title]))
  for (const a of applications ?? []) {
    const title = campaignMap.get(a.campaign_id as string)
    if (title) campaignTitleByApp.set(a.id as string, title)
  }

  const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c]))
  const brandMap = new Map((brands ?? []).map((b) => [b.user_id, b]))

  const convIds = conversations.map((c) => c.id)
  const { data: lastMessages } = await requireSupabase()
    .from('messages')
    .select('conversation_id, message, file_name, created_at, sender_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  const lastByConv = new Map<string, Message>()
  for (const m of lastMessages ?? []) {
    if (!lastByConv.has(m.conversation_id)) {
      lastByConv.set(m.conversation_id, m as Message)
    }
  }

  const unreadMap = await fetchUnreadCountsByConversation(userId, convIds)

  return conversations.map((conv) => {
    const otherId = role === 'creator' ? conv.brand_id : conv.creator_id
    const app = appMap.get(conv.application_id)
    return {
      ...conv,
      application: app,
      campaign_title: campaignTitleByApp.get(conv.application_id) ?? 'Campaign',
      other_party_name:
        role === 'creator'
          ? brandMap.get(otherId)?.company_name ?? 'Brand'
          : creatorMap.get(otherId)?.full_name ?? 'Creator',
      other_party_avatar:
        role === 'creator'
          ? brandMap.get(otherId)?.logo_url ?? null
          : creatorMap.get(otherId)?.avatar_url ?? null,
      last_message: lastByConv.get(conv.id) ?? null,
      unread_count: unreadMap.get(conv.id) ?? 0,
    }
  })
}

export async function fetchConversationsForRole(
  userId: string,
  role: MessageRoleContext,
): Promise<ConversationWithDetails[]> {
  const column = role === 'creator' ? 'creator_id' : 'brand_id'
  const { data, error } = await requireSupabase()
    .from('conversations')
    .select('*')
    .eq(column, userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return attachConversationDetails(data ?? [], userId, role)
}

/** @deprecated Use fetchConversationsForRole */
export async function fetchConversationsForUser(userId: string): Promise<ConversationWithDetails[]> {
  const { data, error } = await requireSupabase()
    .from('conversations')
    .select('*')
    .or(`creator_id.eq.${userId},brand_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return attachConversationDetails(
    data ?? [],
    userId,
    'creator',
  )
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await requireSupabase()
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function sendMessage(input: {
  conversationId: string
  senderId: string
  senderRole: MessageRoleContext
  message?: string
  fileUrl?: string
  fileName?: string
}): Promise<Message> {
  const text = input.message?.trim()
  if (!text && !input.fileUrl) {
    throw new Error('Message or file is required')
  }

  const payload = {
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    sender_role: input.senderRole,
    message: text || null,
    file_url: input.fileUrl ?? null,
    file_name: input.fileName ?? null,
  }

  let result = await requireSupabase().from('messages').insert(payload).select().single()

  if (result.error && /sender_role/i.test(result.error.message)) {
    const { sender_role: _role, ...legacyPayload } = payload
    result = await requireSupabase().from('messages').insert(legacyPayload).select().single()
  }

  if (result.error) throw result.error
  return { ...result.data, sender_role: result.data.sender_role ?? input.senderRole }
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await requireSupabase().from('conversation_reads').upsert(
    { conversation_id: conversationId, user_id: userId, last_read_at: now },
    { onConflict: 'conversation_id,user_id' },
  )
  if (error) throw error
}

async function fetchUnreadCountsByConversation(
  userId: string,
  conversationIds: string[],
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  if (!conversationIds.length) return result

  const { data: reads } = await requireSupabase()
    .from('conversation_reads')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
    .in('conversation_id', conversationIds)

  const readMap = new Map((reads ?? []).map((r) => [r.conversation_id, r.last_read_at]))

  const { data: messages } = await requireSupabase()
    .from('messages')
    .select('conversation_id, sender_id, created_at')
    .in('conversation_id', conversationIds)

  for (const convId of conversationIds) {
    const lastRead = readMap.get(convId)
    const unread = (messages ?? []).filter(
      (m) =>
        m.conversation_id === convId &&
        m.sender_id !== userId &&
        (!lastRead || m.created_at > lastRead),
    ).length
    result.set(convId, unread)
  }

  return result
}

export async function fetchUnreadCountsByRole(
  userId: string,
): Promise<{ creator: number; brand: number }> {
  const [creatorConvs, brandConvs] = await Promise.all([
    requireSupabase().from('conversations').select('id').eq('creator_id', userId),
    requireSupabase().from('conversations').select('id').eq('brand_id', userId),
  ])
  if (creatorConvs.error) throw creatorConvs.error
  if (brandConvs.error) throw brandConvs.error

  const [creatorCounts, brandCounts] = await Promise.all([
    fetchUnreadCountsByConversation(
      userId,
      (creatorConvs.data ?? []).map((c) => c.id),
    ),
    fetchUnreadCountsByConversation(userId, (brandConvs.data ?? []).map((c) => c.id)),
  ])

  const creator = [...creatorCounts.values()].reduce((sum, n) => sum + n, 0)
  const brand = [...brandCounts.values()].reduce((sum, n) => sum + n, 0)
  return { creator, brand }
}

export async function fetchTotalUnreadMessagesForRole(
  userId: string,
  role: MessageRoleContext,
): Promise<number> {
  const column = role === 'creator' ? 'creator_id' : 'brand_id'
  const { data: convs, error } = await requireSupabase()
    .from('conversations')
    .select('id')
    .eq(column, userId)
  if (error) throw error
  const ids = (convs ?? []).map((c) => c.id)
  const counts = await fetchUnreadCountsByConversation(userId, ids)
  return [...counts.values()].reduce((sum, n) => sum + n, 0)
}

/** @deprecated Use fetchTotalUnreadMessagesForRole */
export async function fetchTotalUnreadMessages(userId: string): Promise<number> {
  const { data: convs, error } = await requireSupabase()
    .from('conversations')
    .select('id')
    .or(`creator_id.eq.${userId},brand_id.eq.${userId}`)
  if (error) throw error
  const ids = (convs ?? []).map((c) => c.id)
  const counts = await fetchUnreadCountsByConversation(userId, ids)
  return [...counts.values()].reduce((sum, n) => sum + n, 0)
}

export async function fetchRecentMessagesForRole(
  userId: string,
  role: MessageRoleContext,
  limit = 5,
) {
  const convs = await fetchConversationsForRole(userId, role)
  return convs
    .filter((c) => c.last_message)
    .sort((a, b) => {
      const at = a.last_message?.created_at ?? ''
      const bt = b.last_message?.created_at ?? ''
      return bt.localeCompare(at)
    })
    .slice(0, limit)
}

/** @deprecated Use fetchRecentMessagesForRole */
export async function fetchRecentMessagesForUser(userId: string, limit = 5) {
  const convs = await fetchConversationsForRole(userId, 'creator')
  return convs
    .filter((c) => c.last_message)
    .sort((a, b) => {
      const at = a.last_message?.created_at ?? ''
      const bt = b.last_message?.created_at ?? ''
      return bt.localeCompare(at)
    })
    .slice(0, limit)
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void,
): () => void {
  const client = requireSupabase()
  const channel = client
    .channel(`messages:${conversationId}:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message),
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

export async function approveApplicationContent(applicationId: string): Promise<Application> {
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({ status: 'approved' })
    .eq('id', applicationId)
    .eq('status', 'content_submitted')
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

export async function completeCollaboration(applicationId: string): Promise<Application> {
  const now = new Date().toISOString()
  const { data, error } = await requireSupabase()
    .from('applications')
    .update({
      status: 'completed',
      completed_at: now,
      brand_marked_complete_at: now,
      creator_confirmed_at: now,
    })
    .eq('id', applicationId)
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

export async function countActiveCollaborations(
  userId: string,
  role: 'creator' | 'brand',
): Promise<number> {
  const statuses = ['accepted', 'in_progress', 'content_submitted', 'approved', 'pending_completion']
  const column = role === 'creator' ? 'creator_id' : 'brand_id'
  const { count, error } = await requireSupabase()
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId)
    .in('status', statuses)
  if (error) throw error
  return count ?? 0
}
