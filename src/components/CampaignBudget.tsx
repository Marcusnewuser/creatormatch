import { Wallet } from 'lucide-react'
import { formatBudget } from '../lib/currency'
import { cn } from '../lib/utils'

interface CampaignBudgetProps {
  budget: string | null | undefined
  currency?: string | null
  className?: string
  iconClassName?: string
  showIcon?: boolean
}

export function CampaignBudget({
  budget,
  currency,
  className,
  iconClassName,
  showIcon = true,
}: CampaignBudgetProps) {
  const formatted = formatBudget(budget, currency)
  if (formatted === 'TBD') return null

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {showIcon && <Wallet className={cn('h-3.5 w-3.5', iconClassName)} />}
      {formatted}
    </span>
  )
}
