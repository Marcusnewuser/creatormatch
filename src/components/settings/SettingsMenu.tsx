import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export function SettingsSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('mb-6', className)}>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
        {children}
      </div>
    </section>
  )
}

export function SettingsRow({
  to,
  label,
  subtitle,
  badge,
  disabled,
  soon,
  onClick,
}: {
  to?: string
  label: string
  subtitle?: string
  badge?: number
  disabled?: boolean
  soon?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', disabled ? 'text-text-secondary' : 'text-text-primary')}>
          {label}
        </p>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {soon && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">Soon</span>
      )}
      {!disabled && !soon && <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" />}
    </>
  )

  const rowClass = cn(
    'flex items-center gap-3 px-4 py-3.5 transition-colors border-b border-border last:border-b-0',
    disabled || soon ? 'cursor-default' : 'hover:bg-gray-50',
  )

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={cn(rowClass, 'w-full text-left')}>
        {content}
      </button>
    )
  }

  if (to && !disabled && !soon) {
    return (
      <Link to={to} className={rowClass}>
        {content}
      </Link>
    )
  }

  return <div className={rowClass}>{content}</div>
}
