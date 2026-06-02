import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Strip accidental /rest/v1 suffix — SDK adds paths itself. */
export function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '')
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseUrl = normalizeSupabaseUrl(rawUrl)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-project-ref') ||
  supabaseAnonKey === 'your-anon-key'

export const isSupabaseConfigured = !isPlaceholder

/**
 * Supabase client. Only initialized when env vars are present —
 * calling createClient with empty strings throws and crashes the app.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env.local file and restart the dev server.',
    )
  }
  return supabase
}
