import { useEffect, useState, type FormEvent } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Select } from './ui/Select'
import { CAMPAIGN_CATEGORIES } from '../lib/constants'
import { CAMPAIGN_PLATFORMS, CAMPAIGN_STATUSES } from '../lib/campaign-filters'
import {
  budgetPlaceholder,
  getCurrencyForCountry,
  normalizeBudgetInput,
  SUPPORTED_COUNTRIES,
} from '../lib/currency'
import { hasCampaignPlatformColumn, hasCurrencyColumns } from '../lib/schema'
import type { Campaign, CampaignStatus } from '../types/database'

export interface CampaignFormValues {
  title: string
  category: string
  platform: string
  country: string
  currency: string
  location: string
  budget: string
  description: string
  requirements: string
  status: CampaignStatus
}

interface CampaignFormProps {
  initial?: Partial<Campaign>
  defaultCountry?: string
  submitLabel: string
  loading?: boolean
  error?: string | null
  onSubmit: (values: CampaignFormValues) => Promise<void>
}

export function CampaignForm({
  initial,
  defaultCountry,
  submitLabel,
  loading,
  error,
  onSubmit,
}: CampaignFormProps) {
  const [category, setCategory] = useState(initial?.category ?? '')
  const [platform, setPlatform] = useState(initial?.platform ?? '')
  const [country, setCountry] = useState(initial?.country ?? defaultCountry ?? '')
  const [status, setStatus] = useState<CampaignStatus>(initial?.status ?? 'active')
  const [currencyColumnsReady, setCurrencyColumnsReady] = useState(false)
  const [platformColumnReady, setPlatformColumnReady] = useState(false)

  useEffect(() => {
    Promise.all([hasCurrencyColumns(), hasCampaignPlatformColumn()]).then(
      ([currencyReady, platformReady]) => {
        setCurrencyColumnsReady(currencyReady)
        setPlatformColumnReady(platformReady)
      },
    )
  }, [])

  const currency = getCurrencyForCountry(country) ?? ''

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const selectedCountry = country
    const derivedCurrency = getCurrencyForCountry(selectedCountry)

    if (currencyColumnsReady && selectedCountry && !derivedCurrency) return

    await onSubmit({
      title: form.get('title') as string,
      category,
      platform,
      country: currencyColumnsReady ? selectedCountry : '',
      currency: currencyColumnsReady && derivedCurrency ? derivedCurrency : '',
      location: (form.get('location') as string) || '',
      budget: normalizeBudgetInput((form.get('budget') as string) || ''),
      description: (form.get('description') as string) || '',
      requirements: (form.get('requirements') as string) || '',
      status,
    })
  }

  const requirementsText = Array.isArray(initial?.requirements)
    ? initial.requirements.join('\n')
    : ''

  return (
    <form className="space-y-5 animate-slide-up" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input
        label="Title"
        name="title"
        placeholder="e.g. Summer Collection Launch"
        defaultValue={initial?.title ?? ''}
        required
      />
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={[
          { value: '', label: 'Select a category' },
          ...CAMPAIGN_CATEGORIES.map((c) => ({ value: c, label: c })),
        ]}
        required
      />
      {platformColumnReady ? (
        <Select
          label="Platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          options={[
            { value: '', label: 'Select a platform' },
            ...CAMPAIGN_PLATFORMS.map((p) => ({ value: p, label: p })),
          ]}
          required
        />
      ) : (
        <p className="text-sm text-amber-700 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          Run migration <code className="text-xs">002_campaign_system.sql</code> in Supabase to enable
          the platform field on campaigns.
        </p>
      )}
      {currencyColumnsReady ? (
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
            label="Currency"
            value={currency || 'Select a country first'}
            disabled
            readOnly
            hint="Automatically set based on the selected country."
          />
        </>
      ) : (
        <p className="text-sm text-amber-700 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          Run migration <code className="text-xs">004_currency_support.sql</code> in Supabase to enable
          country and currency on campaigns.
        </p>
      )}
      <Input
        label="Location"
        name="location"
        placeholder="e.g. Remote, Kuala Lumpur"
        defaultValue={initial?.location ?? ''}
      />
      <Input
        label="Budget Amount"
        name="budget"
        type="number"
        min={0}
        step={1}
        placeholder={currency ? budgetPlaceholder(currency) : 'Select a country first'}
        defaultValue={initial?.budget ?? ''}
        hint={currency ? `Enter amount in ${currency}. Display uses local currency formatting.` : undefined}
      />
      <Textarea
        label="Description"
        name="description"
        placeholder="Describe the campaign..."
        defaultValue={initial?.description ?? ''}
      />
      <Textarea
        label="Requirements"
        name="requirements"
        placeholder="One requirement per line..."
        hint="Enter each requirement on a new line."
        defaultValue={requirementsText}
      />
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as CampaignStatus)}
        options={CAMPAIGN_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
      />
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        disabled={currencyColumnsReady && !!country && !currency}
      >
        {submitLabel}
      </Button>
    </form>
  )
}
