import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useMatch, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { CreatorProfileHeader } from '../../components/creator/CreatorProfileHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { LoadingState } from '../../components/ui/LoadingState'
import { NativeFileInput } from '../../components/ui/NativeFileInput'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchCreatorProfileWithPosts,
  updateCreatorProfile,
  uploadFile,
} from '../../lib/api'
import { CAMPAIGN_CATEGORIES } from '../../lib/constants'
import { getCurrencyForCountry, SUPPORTED_COUNTRIES } from '../../lib/currency'
import { hasCreatorPostsTable, hasCurrencyColumns, hasPortfolioColumns } from '../../lib/schema'
import type { CreatorProfile } from '../../types/database'

const EMPTY_CREATOR_PROFILE: CreatorProfile = {
  id: '',
  user_id: '',
  full_name: null,
  avatar_url: null,
  banner_url: null,
  bio: null,
  location: null,
  country: null,
  preferred_currency: null,
  follower_count: null,
  average_views: null,
  average_likes: null,
  engagement_rate: null,
  instagram_url: null,
  xiaohongshu_url: null,
  category: null,
  created_at: '',
  updated_at: '',
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return 'Failed to save profile'
}

export default function EditCreatorProfile() {
  const navigate = useNavigate()
  const isCreate = Boolean(useMatch('/creator/profile/create'))
  const avatarInputId = useId()
  const bannerInputId = useId()
  const { user, refreshAccount, switchMode } = useAuth()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [country, setCountry] = useState('')
  const [currencyColumnsReady, setCurrencyColumnsReady] = useState(false)
  const [portfolioColumnsReady, setPortfolioColumnsReady] = useState(false)
  const [postsReady, setPostsReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preferredCurrency = getCurrencyForCountry(country) ?? ''
  const displayProfile = profile ?? { ...EMPTY_CREATOR_PROFILE, user_id: user?.id ?? '' }

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchCreatorProfileWithPosts(user.id),
      hasCurrencyColumns(),
      hasPortfolioColumns(),
      hasCreatorPostsTable(),
    ])
      .then(([data, currencyReady, portfolioReady, postsTableReady]) => {
        setProfile(data?.profile ?? null)
        setCountry(data?.profile?.country ?? '')
        setCurrencyColumnsReady(currencyReady)
        setPortfolioColumnsReady(portfolioReady)
        setPostsReady(postsTableReady)
      })
      .finally(() => setLoading(false))
  }, [user])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    setError(null)
    try {
      const url = await uploadFile('avatars', user.id, file)
      setProfile((p) =>
        p ? { ...p, avatar_url: url } : { ...EMPTY_CREATOR_PROFILE, user_id: user.id, avatar_url: url },
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user || !portfolioColumnsReady) return
    setUploadingBanner(true)
    setError(null)
    try {
      const url = await uploadFile('portfolio', user.id, file)
      setProfile((p) =>
        p ? { ...p, banner_url: url } : { ...EMPTY_CREATOR_PROFILE, user_id: user.id, banner_url: url },
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploadingBanner(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    const form = new FormData(e.currentTarget)

    setSaving(true)
    setError(null)

    try {
      const updates: Parameters<typeof updateCreatorProfile>[1] = {
        full_name: (form.get('full_name') as string) || null,
        bio: (form.get('bio') as string) || null,
        location: (form.get('location') as string) || null,
        follower_count: Number(form.get('follower_count')) || 0,
        instagram_url: (form.get('instagram_url') as string) || null,
        xiaohongshu_url: (form.get('xiaohongshu_url') as string) || null,
        category: (form.get('category') as string) || null,
        avatar_url: profile?.avatar_url ?? null,
      }

      if (portfolioColumnsReady) {
        updates.banner_url = profile?.banner_url ?? null
      }

      if (currencyColumnsReady && country) {
        const currency = getCurrencyForCountry(country)
        if (currency) {
          updates.country = country
          updates.preferred_currency = currency
        }
      }

      await updateCreatorProfile(user.id, updates)
      await refreshAccount()
      if (isCreate) {
        switchMode('creator')
        navigate('/creator/home')
      } else {
        navigate('/creator/profile')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title={isCreate ? 'Create Creator Profile' : 'Edit Profile'} back />

      {!portfolioColumnsReady && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migration <code className="text-xs">006_creator_portfolio.sql</code> in Supabase to enable
          cover banner uploads.
        </div>
      )}

      <div className="mb-6 animate-slide-up">
        <CreatorProfileHeader profile={displayProfile} showLocation={false} />
        <div className="mt-4 space-y-4 rounded-xl border border-border bg-white p-4 shadow-soft">
          <NativeFileInput
            id={avatarInputId}
            label="Profile photo"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
            hint={uploadingAvatar ? 'Uploading…' : 'JPG or PNG, max 5MB'}
          />
          {portfolioColumnsReady && (
            <NativeFileInput
              id={bannerInputId}
              label="Cover banner"
              onChange={handleBannerChange}
              disabled={uploadingBanner}
              hint={uploadingBanner ? 'Uploading…' : 'Wide image works best (e.g. 1200×400)'}
            />
          )}
        </div>
      </div>

      <form className="space-y-5 animate-slide-up stagger-1" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {currencyColumnsReady === false && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Country and currency fields are unavailable until migration{' '}
            <code className="text-xs">004_currency_support.sql</code> is run in Supabase.
          </div>
        )}

        <Input label="Name" name="full_name" defaultValue={profile?.full_name ?? ''} required />
        <Textarea label="Bio" name="bio" defaultValue={profile?.bio ?? ''} />

        {currencyColumnsReady && (
          <>
            <Select
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[
                { value: '', label: 'Select a country (optional)' },
                ...SUPPORTED_COUNTRIES.map((c) => ({ value: c, label: c })),
              ]}
            />
            <Input
              label="Preferred Currency"
              value={preferredCurrency || (country ? '—' : 'Select a country first')}
              disabled
              readOnly
              hint="Automatically set based on your country."
            />
          </>
        )}

        <Input label="Location" name="location" defaultValue={profile?.location ?? ''} />
        <Input
          label="Followers"
          name="follower_count"
          type="number"
          min={0}
          defaultValue={profile?.follower_count ?? 0}
        />

        <Select
          label="Category"
          name="category"
          defaultValue={profile?.category ?? ''}
          options={[
            { value: '', label: 'Select a category' },
            ...CAMPAIGN_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Input label="Instagram URL" name="instagram_url" defaultValue={profile?.instagram_url ?? ''} />
        <Input label="Xiaohongshu URL" name="xiaohongshu_url" defaultValue={profile?.xiaohongshu_url ?? ''} />
        <Button type="submit" fullWidth size="lg" loading={saving}>
          {isCreate ? 'Create Profile' : 'Save Profile'}
        </Button>
      </form>

      {postsReady && !isCreate && (
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Portfolio</h3>
              <p className="text-sm text-text-secondary mt-0.5">
                Add work samples brands can browse on your profile.
              </p>
            </div>
            <Link to="/creator/posts/create">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!postsReady && !isCreate && (
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migration <code className="text-xs">007_creator_posts.sql</code> in Supabase to enable posts.
        </div>
      )}
    </div>
  )
}
