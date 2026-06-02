import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex items-start gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-text-secondary hover:bg-gray-50 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
