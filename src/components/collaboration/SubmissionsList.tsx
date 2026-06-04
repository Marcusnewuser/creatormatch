import { ExternalLink } from 'lucide-react'
import { formatDate } from '../../lib/constants'
import type { Submission } from '../../types/database'

export function SubmissionsList({ submissions }: { submissions: Submission[] }) {
  if (!submissions.length) {
    return <p className="text-sm text-text-secondary">No content submissions yet.</p>
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="rounded-xl border border-border bg-white p-4"
        >
          <a
            href={sub.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline break-all"
          >
            {sub.content_url}
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
          {sub.notes && (
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">{sub.notes}</p>
          )}
          <p className="mt-2 text-xs text-text-secondary">Submitted {formatDate(sub.created_at)}</p>
        </div>
      ))}
    </div>
  )
}
