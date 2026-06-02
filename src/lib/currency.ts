export const COUNTRY_CURRENCY = {
  Malaysia: 'MYR',
  Singapore: 'SGD',
  'United States': 'USD',
  Indonesia: 'IDR',
  Thailand: 'THB',
  Philippines: 'PHP',
  Vietnam: 'VND',
  Australia: 'AUD',
  'United Kingdom': 'GBP',
} as const

export type SupportedCountry = keyof typeof COUNTRY_CURRENCY
export type SupportedCurrency = (typeof COUNTRY_CURRENCY)[SupportedCountry]

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_CURRENCY) as SupportedCountry[]

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  MYR: 'RM',
  USD: '$',
  SGD: 'SGD',
  IDR: 'Rp',
  THB: '฿',
  GBP: '£',
  AUD: 'A$',
  PHP: '₱',
  VND: '₫',
}

export function getCurrencyForCountry(country: string | null | undefined): SupportedCurrency | null {
  if (!country) return null
  return COUNTRY_CURRENCY[country as SupportedCountry] ?? null
}

export function parseBudgetAmount(budget: string | null | undefined): number {
  if (!budget) return 0
  const digits = budget.replace(/[^0-9.]/g, '')
  const value = Number.parseFloat(digits)
  return Number.isNaN(value) ? 0 : value
}

export function normalizeBudgetInput(value: string): string {
  const amount = parseBudgetAmount(value)
  if (amount === 0) return ''
  return Number.isInteger(amount) ? String(Math.round(amount)) : String(amount)
}

export function formatBudget(
  budget: string | null | undefined,
  currency: string | null | undefined,
): string {
  const amount = parseBudgetAmount(budget)
  if (amount === 0) return 'TBD'

  const curr = (currency ?? 'USD') as SupportedCurrency
  const symbol = CURRENCY_SYMBOLS[curr] ?? curr
  const formatted = amount.toLocaleString('en-US', { maximumFractionDigits: 0 })

  switch (curr) {
    case 'USD':
    case 'AUD':
      return `${symbol}${formatted}`
    case 'GBP':
      return `${symbol}${formatted}`
    case 'MYR':
      return `${symbol} ${formatted}`
    case 'SGD':
      return `${symbol} ${formatted}`
    case 'IDR':
    case 'VND':
    case 'THB':
    case 'PHP':
      return `${symbol}${formatted}`
    default:
      return `${symbol} ${formatted}`
  }
}

export function budgetPlaceholder(currency: SupportedCurrency | null): string {
  if (!currency) return 'e.g. 2500'
  return 'e.g. 2500'
}
