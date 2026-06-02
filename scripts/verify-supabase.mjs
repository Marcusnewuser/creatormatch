import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function normalizeSupabaseUrl(url) {
  return url.replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '')
}

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    console.error('❌ .env.local not found.')
    console.error('   Copy .env.example → .env.local and add your Supabase credentials.')
    process.exit(1)
  }

  const env = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnvLocal()
const url = normalizeSupabaseUrl(env.VITE_SUPABASE_URL)
const key = env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local')
  process.exit(1)
}

if (url.includes('your-project-ref') || key === 'your-anon-key') {
  console.error('❌ Replace placeholder values in .env.local with your real Supabase credentials.')
  process.exit(1)
}

console.log('🔌 Connecting to Supabase...')
const supabase = createClient(url, key)

const checks = [
  { name: 'profiles table', query: () => supabase.from('profiles').select('id', { count: 'exact', head: true }) },
  { name: 'creator_profiles table', query: () => supabase.from('creator_profiles').select('id', { count: 'exact', head: true }) },
  { name: 'brand_profiles table', query: () => supabase.from('brand_profiles').select('id', { count: 'exact', head: true }) },
  { name: 'campaigns table', query: () => supabase.from('campaigns').select('id', { count: 'exact', head: true }) },
  { name: 'applications table', query: () => supabase.from('applications').select('id', { count: 'exact', head: true }) },
]

let failed = false

for (const check of checks) {
  const { error } = await check.query()
  if (error) {
    console.error(`❌ ${check.name}: ${error.message}`)
    failed = true
  } else {
    console.log(`✅ ${check.name}`)
  }
}

if (failed) {
  console.error('\n⚠️  Some tables are missing. Run migrations in the Supabase SQL Editor:')
  console.error('   1. supabase/migrations/001_initial_schema.sql')
  console.error('   2. supabase/migrations/002_campaign_system.sql (if upgrading an existing project)')
  console.error('   3. supabase/migrations/003_application_system.sql (if upgrading an existing project)')
  console.error('   4. supabase/migrations/004_currency_support.sql (if upgrading an existing project)')
  process.exit(1)
}

const { error: currencyError } = await supabase
  .from('creator_profiles')
  .select('country, preferred_currency')
  .limit(0)

if (currencyError) {
  console.warn('\n⚠️  Currency migration not applied yet.')
  console.warn('   Run supabase/migrations/004_currency_support.sql in the Supabase SQL Editor.')
  console.warn('   Profile country and campaign currency fields will be limited until then.')
} else {
  console.log('✅ currency columns (country/currency)')
}

console.log('\n✅ Supabase is connected and the database schema looks good!')
console.log('   Restart your dev server: npm run dev')
