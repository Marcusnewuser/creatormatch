import { useEffect, useId, useState, type FormEvent } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { BrandProfileHeader } from '../../components/brand/BrandProfileHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { LoadingState } from '../../components/ui/LoadingState'
import { NativeFileInput } from '../../components/ui/NativeFileInput'
import { useAuth } from '../../contexts/AuthContext'
import { fetchBrandProfile, updateBrandProfile, uploadFile } from '../../lib/api'
import { SUPPORTED_COUNTRIES } from '../../lib/currency'
import { hasBrandBannerColumn, hasCurrencyColumns } from '../../lib/schema'
import type { BrandProfile } from '../../types/database'

const INDUSTRIES = [
  'Fashion & Apparel',
  'Technology',
  'Food & Beverage',
  'Beauty & Cosmetics',
  'Travel & Hospitality',
  'Health & Fitness',
  'Other',
]

const EMPTY_BRAND_PROFILE: BrandProfile = {
  id: '',
  user_id: '',
  company_name: null,
  logo_url: null,
  banner_url: null,
  description: null,
  industry: null,
  website: null,
  location: null,
  country: null,
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

export default function EditBrandProfile() {
  const navigate = useNavigate()
  const isCreate = Boolean(useMatch('/brand/profile/create'))
  const bannerInputId = useId()
  const logoInputId = useId()
  const { user, refreshAccount, switchMode } = useAuth()
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [currencyColumnsReady, setCurrencyColumnsReady] = useState(false)
  const [bannerColumnReady, setBannerColumnReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayProfile = profile ?? { ...EMPTY_BRAND_PROFILE, user_id: user?.id ?? '' }

  useEffect(() => {
    if (!user) return
    Promise.all([fetchBrandProfile(user.id), hasCurrencyColumns(), hasBrandBannerColumn()])
      .then(([p, currencyReady, bannerReady]) => {
        setProfile(p)
        setIndustry(p?.industry ?? '')
        setCountry(p?.country ?? '')
        setCurrencyColumnsReady(currencyReady)
        setBannerColumnReady(bannerReady)
      })
      .finally(() => setLoading(false))
  }, [user])

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user || !bannerColumnReady) return
    setUploadingBanner(true)
    setError(null)
    try {
      const url = await uploadFile('portfolio', user.id, file)
      setProfile((p) =>
        p ? { ...p, banner_url: url } : { ...EMPTY_BRAND_PROFILE, user_id: user.id, banner_url: url },
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploadingBanner(false)
      e.target.value = ''
    }
  }

  async function handleRemoveBanner() {
    setProfile((p) => (p ? { ...p, banner_url: null } : p))
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingLogo(true)
    setError(null)
    try {
      const url = await uploadFile('logos', user.id, file)
      setProfile((p) =>
        p ? { ...p, logo_url: url } : { ...EMPTY_BRAND_PROFILE, user_id: user.id, logo_url: url },
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploadingLogo(false)
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
      const updates: Parameters<typeof updateBrandProfile>[1] = {
        company_name: (form.get('company_name') as string) || null,
        description: (form.get('description') as string) || null,
        industry: industry || null,
        website: (form.get('website') as string) || null,
        location: (form.get('location') as string) || null,
        logo_url: profile?.logo_url ?? null,
      }

      if (bannerColumnReady) {
        updates.banner_url = profile?.banner_url ?? null
      }

      if (currencyColumnsReady && country) {
        updates.country = country
      }

      await updateBrandProfile(user.id, updates)
      await refreshAccount()
      if (isCreate) {
        switchMode('brand')
        navigate('/brand/home')
      } else {
        navigate('/brand/profile')
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
      <PageHeader title={isCreate ? 'Create Brand Profile' : 'Edit Company Profile'} back />

      {!bannerColumnReady && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migration <code className="text-xs">009_brand_banner.sql</code> in Supabase to enable cover
          banner uploads.
        </div>
      )}

      <div className="mb-6 animate-slide-up">
        <BrandProfileHeader profile={displayProfile} />
        <div className="mt-4 space-y-4 rounded-xl border border-border bg-white p-4 shadow-soft">
          {bannerColumnReady && (
            <>
              <NativeFileInput
                id={bannerInputId}
                label="Cover banner"
                onChange={handleBannerChange}
                disabled={uploadingBanner}
                hint={
                  uploadingBanner
                    ? 'Uploading…'
                    : 'Wide image works best (e.g. 1200×400). JPG or PNG, max 5MB.'
                }
              />
              {profile?.banner_url && (
                <Button type="button" variant="outline" size="sm" onClick={handleRemoveBanner}>
                  Remove banner
                </Button>
              )}
            </>
          )}
          <NativeFileInput
            id={logoInputId}
            label="Company logo"
            onChange={handleLogoChange}
            disabled={uploadingLogo}
            hint={uploadingLogo ? 'Uploading…' : 'JPG or PNG, max 5MB'}
          />
        </div>
      </div>

      <form className="space-y-5 animate-slide-up stagger-1" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {currencyColumnsReady === false && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Country field is unavailable until migration{' '}
            <code className="text-xs">004_currency_support.sql</code> is run in Supabase.
          </div>
        )}

        <Input label="Company Name" name="company_name" defaultValue={profile?.company_name ?? ''} required />
        <Textarea label="Description" name="description" defaultValue={profile?.description ?? ''} />
        <Select
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
        />
        <Input label="Website" name="website" defaultValue={profile?.website ?? ''} />

        {currencyColumnsReady && (
          <Select
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            options={[
              { value: '', label: 'Select a country (optional)' },
              ...SUPPORTED_COUNTRIES.map((c) => ({ value: c, label: c })),
            ]}
          />
        )}

        <Input label="Location" name="location" defaultValue={profile?.location ?? ''} />
        <Button type="submit" fullWidth size="lg" loading={saving}>
          {isCreate ? 'Create Profile' : 'Save Changes'}
        </Button>
      </form>
    </div>
  )
}
