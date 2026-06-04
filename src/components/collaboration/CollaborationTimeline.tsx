import { Check } from 'lucide-react'
import { COLLABORATION_TIMELINE_STEPS, getTimelineStepIndex } from '../../lib/collaboration-workflow'
import type { ApplicationStatus } from '../../types/database'
import { cn } from '../../lib/utils'

interface CollaborationTimelineProps {
  status: ApplicationStatus
  className?: string
}

export function CollaborationTimeline({ status, className }: CollaborationTimelineProps) {
  const currentIndex = getTimelineStepIndex(status)

  if (currentIndex < 0) return null

  return (
    <div className={cn('rounded-xl border border-border bg-white p-4', className)}>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Collaboration Progress</h3>
      <ol className="space-y-0">
        {COLLABORATION_TIMELINE_STEPS.map((step, index) => {
          const done = index < currentIndex
          const current = index === currentIndex
          const upcoming = index > currentIndex

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold shrink-0',
                    done && 'border-brand-primary bg-brand-primary text-white',
                    current && 'border-brand-primary bg-brand-light text-brand-primary',
                    upcoming && 'border-border bg-gray-50 text-text-secondary',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < COLLABORATION_TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[1.25rem] my-1',
                      done ? 'bg-brand-primary' : 'bg-border',
                    )}
                  />
                )}
              </div>
              <div className={cn('pb-4 min-w-0', index === COLLABORATION_TIMELINE_STEPS.length - 1 && 'pb-0')}>
                <p
                  className={cn(
                    'text-sm font-medium',
                    current ? 'text-brand-primary' : done ? 'text-text-primary' : 'text-text-secondary',
                  )}
                >
                  {step.label}
                </p>
                {current && (
                  <p className="text-xs text-text-secondary mt-0.5">Current step</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
