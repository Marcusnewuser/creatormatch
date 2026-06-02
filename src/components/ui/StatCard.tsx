import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatCard({ label, value, icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-border p-5 shadow-soft animate-slide-up',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary tracking-tight">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trendUp ? 'text-success' : 'text-text-secondary',
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
