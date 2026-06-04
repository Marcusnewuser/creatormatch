import { requireSupabase } from './supabase'
import { normalizeApplication, normalizeCampaign } from './schema'
import type { Application, Submission } from '../types/database'

export type SubmissionInsert = Pick<Submission, 'application_id' | 'creator_id' | 'content_url' | 'notes'>

const URL_PATTERN =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/

export function isValidContentUrl(url: string): boolean {
  return URL_PATTERN.test(url.trim())
}

export async function fetchSubmissionsForApplication(applicationId: string): Promise<Submission[]> {
  const { data, error } = await requireSupabase()
    .from('submissions')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSubmission(
  input: SubmissionInsert,
): Promise<{ submission: Submission; application: Application }> {
  if (!isValidContentUrl(input.content_url)) {
    throw new Error('Enter a valid content URL (https://...)')
  }

  const { data: submission, error: subError } = await requireSupabase()
    .from('submissions')
    .insert({
      application_id: input.application_id,
      creator_id: input.creator_id,
      content_url: input.content_url.trim(),
      notes: input.notes?.trim() || null,
    })
    .select()
    .single()
  if (subError) throw subError

  const { data: appRow, error: appError } = await requireSupabase()
    .from('applications')
    .update({ status: 'content_submitted' })
    .eq('id', input.application_id)
    .eq('creator_id', input.creator_id)
    .eq('status', 'in_progress')
    .select()
    .single()
  if (appError) throw appError

  const { data: campaign } = await requireSupabase()
    .from('campaigns')
    .select('*')
    .eq('id', appRow.campaign_id)
    .maybeSingle()

  const brandId = campaign ? normalizeCampaign(campaign).brand_id : undefined
  return {
    submission,
    application: normalizeApplication(appRow, brandId),
  }
}
