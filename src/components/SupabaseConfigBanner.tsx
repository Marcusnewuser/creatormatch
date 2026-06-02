import { isSupabaseConfigured } from '../lib/supabase'

export function SupabaseConfigBanner() {
  if (isSupabaseConfigured) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-900">
      <strong>Supabase not configured.</strong> Add your credentials to{' '}
      <code className="rounded bg-amber-100 px-1.5 py-0.5">.env.local</code>, then run{' '}
      <code className="rounded bg-amber-100 px-1.5 py-0.5">npm run verify:supabase</code>{' '}
      and restart the dev server.
    </div>
  )
}
