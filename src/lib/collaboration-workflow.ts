import type { ApplicationStatus } from '../types/database'

export const COLLABORATION_TIMELINE_STEPS = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'content_submitted', label: 'Content Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
] as const

export type TimelineStepKey = (typeof COLLABORATION_TIMELINE_STEPS)[number]['key']

const STATUS_ORDER: ApplicationStatus[] = [
  'pending',
  'accepted',
  'in_progress',
  'pending_completion',
  'content_submitted',
  'approved',
  'completed',
  'rejected',
]

export function getTimelineStepIndex(status: ApplicationStatus): number {
  if (status === 'rejected' || status === 'pending') return -1
  if (status === 'pending_completion') return 2
  const map: Partial<Record<ApplicationStatus, number>> = {
    accepted: 0,
    in_progress: 1,
    content_submitted: 2,
    approved: 3,
    completed: 4,
  }
  return map[status] ?? -1
}

export function isActiveCollaboration(status: ApplicationStatus): boolean {
  return ['accepted', 'in_progress', 'content_submitted', 'approved', 'pending_completion'].includes(
    status,
  )
}

export function canAccessCollaborationChat(status: ApplicationStatus): boolean {
  return status !== 'pending' && status !== 'rejected'
}

export function compareApplicationStatus(a: ApplicationStatus, b: ApplicationStatus): number {
  return STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b)
}
