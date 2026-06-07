import { requireSupabase } from './supabase'

export interface CollaborationCompletion {
  id: string
  application_id: string | null
  campaign_id: string | null
  creator_id: string
  brand_id: string
  campaign_title: string | null
  completed_at: string
  created_at: string
}

export async function countCompletedCollaborationsFromRecords(
  userId: string,
  role: 'creator' | 'brand',
): Promise<number> {
  const column = role === 'creator' ? 'creator_id' : 'brand_id'
  const { count, error } = await requireSupabase()
    .from('collaboration_completions')
    .select('*', { count: 'exact', head: true })
    .eq(column, userId)

  if (error) throw error
  return count ?? 0
}

export async function countAllCompletedCollaborations(): Promise<number> {
  const { count, error } = await requireSupabase()
    .from('collaboration_completions')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

export async function fetchCollaborationCompletions(
  userId: string,
  role: 'creator' | 'brand',
  limit = 50,
): Promise<CollaborationCompletion[]> {
  const column = role === 'creator' ? 'creator_id' : 'brand_id'
  const { data, error } = await requireSupabase()
    .from('collaboration_completions')
    .select('*')
    .eq(column, userId)
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as CollaborationCompletion[]
}
