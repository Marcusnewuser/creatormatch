import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ExternalLink, MapPin, Play, UserCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import {
  applicationStatusBadgeVariant,
  applicationStatusLabel,
  fetchApplicationById,
  markCollaborationComplete,
  startCollaboration,
  updateApplicationStatus,
} from '../../lib/api'
import { formatDate, formatFollowers } from '../../lib/constants'
import type { ApplicationWithCreator } from '../../types/database'

export default function ApplicantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState<ApplicationWithCreator | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchApplicationById(id).then(setApplication).finally(() => setLoading(false))
  }, [id])

  async function handleStatus(status: 'accepted' | 'rejected') {
    if (!application) return
    setUpdating(true)
    setError(null)
    try {
      await updateApplicationStatus(application.id, status)
      navigate(-1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application')
    } finally {
      setUpdating(false)
    }
  }

  async function handleStartCollaboration() {
    if (!application) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await startCollaboration(application.id)
      setApplication({ ...application, ...updated })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start collaboration')
    } finally {
      setUpdating(false)
    }
  }

  async function handleMarkComplete() {
    if (!application) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await markCollaborationComplete(application.id)
      setApplication({ ...application, ...updated })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark collaboration complete')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>
  if (!application) return <div className="px-4 pt-6 text-text-secondary">Applicant not found.</div>

  const creator = application.creator_profiles
  const socials = [
    creator?.instagram_url ? { platform: 'Instagram', url: creator.instagram_url } : null,
    creator?.xiaohongshu_url ? { platform: 'Xiaohongshu', url: creator.xiaohongshu_url } : null,
  ].filter(Boolean) as { platform: string; url: string }[]

  const statusVariant = applicationStatusBadgeVariant(application.status)

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title="Applicant Detail" back />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center text-center animate-slide-up">
        <Avatar src={creator?.avatar_url ?? undefined} name={creator?.full_name ?? 'Creator'} size="xl" />
        <h1 className="mt-4 text-xl font-semibold text-text-primary">{creator?.full_name ?? 'Creator'}</h1>
        <p className="text-sm text-text-secondary">{creator?.category ?? 'Creator'}</p>
        <Badge variant={statusVariant} className="mt-2">
          {applicationStatusLabel(application.status)}
        </Badge>
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
          <div>
            <p className="font-semibold text-text-primary">{formatFollowers(creator?.follower_count)}</p>
            <p className="text-text-secondary">Followers</p>
          </div>
          {creator?.location && (
            <div>
              <p className="font-semibold text-text-primary flex items-center justify-center gap-1">
                <MapPin className="h-4 w-4 text-brand-primary" />
                {creator.location}
              </p>
              <p className="text-text-secondary">Location</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-text-secondary">Applied {formatDate(application.created_at)}</p>
        {creator?.user_id && (
          <Link to={`/creators/${creator.user_id}`} className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              <UserCircle className="h-4 w-4" />
              View Full Portfolio
            </Button>
          </Link>
        )}
      </div>

      {application.message && (
        <Card className="mt-6 animate-slide-up stagger-1">
          <h2 className="text-sm font-medium text-text-secondary mb-2">Motivation Message</h2>
          <p className="text-sm text-text-primary leading-relaxed">{application.message}</p>
        </Card>
      )}

      {creator?.bio && (
        <Card className="mt-4 animate-slide-up stagger-1">
          <h2 className="text-sm font-medium text-text-secondary mb-2">Bio</h2>
          <p className="text-sm text-text-primary leading-relaxed">{creator.bio}</p>
        </Card>
      )}

      {application.portfolio_link && (
        <Card className="mt-4 animate-slide-up">
          <h2 className="text-sm font-medium text-text-secondary mb-2">Portfolio</h2>
          <a
            href={application.portfolio_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
          >
            View Portfolio
            <ExternalLink className="h-4 w-4" />
          </a>
        </Card>
      )}

      {socials.length > 0 && (
        <div className="mt-6 animate-slide-up stagger-2">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Social Links</h2>
          <div className="space-y-2">
            {socials.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-white"
              >
                <p className="text-sm font-medium text-text-primary">{social.platform}</p>
                <ExternalLink className="h-4 w-4 text-text-secondary" />
              </a>
            ))}
          </div>
        </div>
      )}

      {application.status === 'pending' && (
        <div className="mt-8 flex gap-3 animate-slide-up stagger-4">
          <Button
            variant="danger"
            fullWidth
            size="lg"
            loading={updating}
            onClick={() => handleStatus('rejected')}
          >
            Reject
          </Button>
          <Button
            fullWidth
            size="lg"
            loading={updating}
            onClick={() => handleStatus('accepted')}
          >
            Accept
          </Button>
        </div>
      )}

      {application.status === 'accepted' && (
        <div className="mt-8 animate-slide-up stagger-4">
          <Button fullWidth size="lg" loading={updating} onClick={handleStartCollaboration}>
            <Play className="h-4 w-4" />
            Start Collaboration
          </Button>
        </div>
      )}

      {application.status === 'in_progress' && (
        <div className="mt-8 animate-slide-up stagger-4">
          <Button fullWidth size="lg" loading={updating} onClick={handleMarkComplete}>
            <CheckCircle2 className="h-4 w-4" />
            Mark as Completed
          </Button>
        </div>
      )}

      {application.status === 'pending_completion' && (
        <Card className="mt-8 animate-slide-up stagger-4">
          <h2 className="text-sm font-semibold text-text-primary">Awaiting creator confirmation</h2>
          <p className="mt-1 text-sm text-text-secondary">
            You marked this collaboration as completed. The creator can confirm or request a review.
          </p>
          {application.review_requested_at && (
            <Badge variant="warning" className="mt-3">
              Review requested {formatDate(application.review_requested_at)}
            </Badge>
          )}
        </Card>
      )}

      {application.status === 'completed' && (
        <Card className="mt-8 animate-slide-up stagger-4 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-sm font-semibold">Collaboration completed</h2>
          </div>
          {application.completed_at && (
            <p className="mt-1 text-sm text-text-secondary">
              Confirmed {formatDate(application.completed_at)}
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
