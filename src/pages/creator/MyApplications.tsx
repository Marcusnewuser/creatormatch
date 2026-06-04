import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MessageCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { CampaignBudget } from '../../components/CampaignBudget'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import {
  applicationStatusBadgeVariant,
  applicationStatusLabel,
  canAccessCollaborationChat,
  completeCollaboration,
  fetchConversationByApplication,
  fetchCreatorApplications,
  withdrawApplication,
} from '../../lib/api'
import { formatDate } from '../../lib/constants'
import type { ApplicationStatus, ApplicationWithCampaign } from '../../types/database'
import { cn } from '../../lib/utils'

type Tab = ApplicationStatus

const tabs: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'content_submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
]

export default function MyApplications() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [applications, setApplications] = useState<ApplicationWithCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [chatLinks, setChatLinks] = useState<Record<string, string>>({})
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadApplications() {
    if (!user) return
    setLoading(true)
    try {
      setApplications(await fetchCreatorApplications(user.id))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [user])

  useEffect(() => {
    if (!user) return
    const active = applications.filter((a) => canAccessCollaborationChat(a.status))
    Promise.all(
      active.map(async (a) => {
        const conv = await fetchConversationByApplication(a.id, user.id, 'creator')
        return conv ? ([a.id, conv.id] as const) : null
      }),
    ).then((pairs) => {
      const map: Record<string, string> = {}
      for (const p of pairs) {
        if (p) map[p[0]] = p[1]
      }
      setChatLinks(map)
    })
  }, [applications])

  async function handleWithdraw(id: string, campaignTitle: string) {
    if (!window.confirm(`Withdraw your application to "${campaignTitle}"?`)) return
    setActionId(id)
    try {
      await withdrawApplication(id)
      setApplications((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw application')
    } finally {
      setActionId(null)
    }
  }

  async function handleComplete(id: string) {
    setActionId(id)
    try {
      const updated = await completeCollaboration(id)
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)))
      setActiveTab('completed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete')
    } finally {
      setActionId(null)
    }
  }

  const grouped = tabs.reduce(
    (acc, tab) => {
      acc[tab.key] = applications.filter((a) => a.status === tab.key)
      return acc
    },
    {} as Record<Tab, ApplicationWithCampaign[]>,
  )

  const items = grouped[activeTab]

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title="My Applications" subtitle="Track your campaign applications" />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              activeTab === key
                ? 'bg-brand-primary text-white shadow-soft'
                : 'bg-white border border-border text-text-secondary hover:border-brand-primary/30',
            )}
          >
            {label}
            <span className="ml-1.5 opacity-70">({grouped[key].length})</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={`No ${tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} applications`}
          description="When you apply to campaigns, they'll appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((app) => (
            <Card key={app.id} className="animate-slide-up">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-text-primary">{app.campaigns.title}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {app.campaigns.brand_profiles?.company_name ?? 'Brand'}
                  </p>
                  <p className="text-xs text-text-secondary mt-2">
                    Applied {formatDate(app.created_at)}
                    {app.campaigns.budget && (
                      <>
                        {' · '}
                        <CampaignBudget
                          budget={app.campaigns.budget}
                          currency={app.campaigns.currency}
                          showIcon={false}
                          className="inline"
                        />
                      </>
                    )}
                  </p>
                </div>
                <Badge variant={applicationStatusBadgeVariant(app.status)}>
                  {applicationStatusLabel(app.status)}
                </Badge>
              </div>

              {app.status === 'pending' && (
                <Button
                  className="mt-4"
                  variant="outline"
                  size="sm"
                  loading={actionId === app.id}
                  onClick={() => handleWithdraw(app.id, app.campaigns.title)}
                >
                  Withdraw Application
                </Button>
              )}

              {chatLinks[app.id] && (
                <Link to={`/creator/messages/${chatLinks[app.id]}`} className="block mt-3">
                  <Button variant="outline" size="sm" fullWidth>
                    <MessageCircle className="h-4 w-4" />
                    Open Chat
                  </Button>
                </Link>
              )}

              {app.status === 'approved' && (
                <Button
                  className="mt-3"
                  size="sm"
                  fullWidth
                  loading={actionId === app.id}
                  onClick={() => handleComplete(app.id)}
                >
                  Mark Collaboration Complete
                </Button>
              )}

              {app.status === 'in_progress' && (
                <p className="mt-3 text-xs text-text-secondary">
                  Submit content from the collaboration chat.
                </p>
              )}

              {app.status === 'completed' && app.completed_at && (
                <p className="mt-3 text-xs text-text-secondary">
                  Completed {formatDate(app.completed_at)}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
