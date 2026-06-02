import { cn } from '../../lib/utils'

interface LoadingStateProps {
  variant?: 'page' | 'card' | 'inline'
  className?: string
}

export function LoadingState({ variant = 'page', className }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="h-8 w-8 rounded-full border-2 border-brand-light border-t-brand-primary animate-spin" />
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[50vh] gap-4', className)}>
      <div className="h-10 w-10 rounded-full border-2 border-brand-light border-t-brand-primary animate-spin" />
      <p className="text-sm text-text-secondary">Loading...</p>
    </div>
  )
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border p-5 space-y-3">
          <div className="skeleton h-36 w-full rounded-xl" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
