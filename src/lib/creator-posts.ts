import { requireSupabase } from './supabase'
import { countCompletedCollaborations } from './applications'
import type { CreatorPost, CreatorProfile, CreatorProfileWithPosts } from '../types/database'

export type CreatorPostInsert = Pick<
  CreatorPost,
  'title' | 'description' | 'thumbnail_url' | 'category'
>

const VIEW_SESSION_PREFIX = 'creatormatch_post_view_'
const VIEW_DEBOUNCE_MS = 5000

export function formatPostMetric(value: number | null | undefined): string {
  if (value == null || value === 0) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

export function computePostStats(posts: CreatorPost[], completedCollaborations = 0) {
  return {
    totalPosts: posts.length,
    totalViews: posts.reduce((sum, p) => sum + (p.views_count ?? 0), 0),
    totalLikes: posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0),
    completedCollaborations,
  }
}

export async function fetchCreatorPosts(creatorId: string): Promise<CreatorPost[]> {
  const { data, error } = await requireSupabase()
    .from('creator_posts')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchCreatorProfileWithPosts(
  userId: string,
): Promise<CreatorProfileWithPosts | null> {
  const { data: profile, error: profileError } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile) return null

  let posts: CreatorPost[] = []
  let completedCollaborations = 0
  try {
    posts = await fetchCreatorPosts(userId)
  } catch {
    posts = []
  }

  try {
    completedCollaborations = await countCompletedCollaborations(userId, 'creator')
  } catch {
    completedCollaborations = 0
  }

  return { profile, posts, stats: computePostStats(posts, completedCollaborations) }
}

export async function fetchPostById(postId: string): Promise<CreatorPost | null> {
  const { data, error } = await requireSupabase()
    .from('creator_posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createCreatorPost(
  creatorId: string,
  post: CreatorPostInsert,
): Promise<CreatorPost> {
  const { data, error } = await requireSupabase()
    .from('creator_posts')
    .insert({ ...post, creator_id: creatorId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCreatorPost(
  creatorId: string,
  postId: string,
  updates: Partial<CreatorPostInsert>,
): Promise<CreatorPost> {
  const { data, error } = await requireSupabase()
    .from('creator_posts')
    .update(updates)
    .eq('id', postId)
    .eq('creator_id', creatorId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCreatorPost(creatorId: string, postId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('creator_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', creatorId)
  if (error) throw error
}

/** Record one view per browser session; debounce rapid refreshes. */
export async function trackPostView(postId: string): Promise<boolean> {
  const sessionKey = `${VIEW_SESSION_PREFIX}${postId}`
  const debounceKey = `${sessionKey}_ts`

  if (sessionStorage.getItem(sessionKey)) return false

  const lastAttempt = sessionStorage.getItem(debounceKey)
  if (lastAttempt && Date.now() - Number(lastAttempt) < VIEW_DEBOUNCE_MS) {
    return false
  }
  sessionStorage.setItem(debounceKey, String(Date.now()))

  const { error } = await requireSupabase().rpc('increment_post_view', { p_post_id: postId })
  if (error) throw error

  sessionStorage.setItem(sessionKey, '1')
  return true
}

export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  const { data, error } = await requireSupabase()
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })
  if (error && error.code !== '23505') throw error
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function fetchPostWithCreator(postId: string): Promise<{
  post: CreatorPost
  creator: CreatorProfile | null
  likedByUser: boolean
} | null> {
  const post = await fetchPostById(postId)
  if (!post) return null

  const { data: creator, error: creatorError } = await requireSupabase()
    .from('creator_profiles')
    .select('*')
    .eq('user_id', post.creator_id)
    .maybeSingle()
  if (creatorError) throw creatorError

  return { post, creator, likedByUser: false }
}
