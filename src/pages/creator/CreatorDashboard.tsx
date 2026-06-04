import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MessageCircle, TrendingUp, Users } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { CampaignCard } from '../../components/CampaignCard'
import { Card } from '../../components/ui/Card'
import { Avatar } from '../../components/ui/Avatar'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../contexts/AuthContext'
import {
  countActiveCollaborations,
  countApplicationsByStatus,
  countCompletedCollaborations,
  fetchCreatorProfile,
  fetchRecentCampaigns,
  fetchRecentMessagesForUser,
  fetchRecentActivity,
} from '../../lib/api'
import { formatFollowers, formatRelativeTime } from '../../lib/constants'
import type { ConversationWithDetails } from '../../types/database'
import type { CampaignWithBrand } from '../../types/database'
import type { CreatorProfile } from '../../types/database'

export default function CreatorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [recommended, setRecommended] = useState<CampaignWithBrand[]>([])
  const [recentMessages, setRecentMessages] = useState<ConversationWithDetails[]>([])
  const [activity, setActivity] = useState<{ id: string; text: string; time: string }[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    activeCollaborations: 0,
    completed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchCreatorProfile(user.id),
      fetchRecentCampaigns(8),
      fetchRecentActivity(5),
      countApplicationsByStatus(user.id, 'creator'),
      countActiveCollaborations(user.id, 'creator'),
      countCompletedCollaborations(user.id, 'creator'),
      fetchRecentMessagesForUser(user.id, 5),
    ])
      .then(([creatorProfile, campaigns, recentActivity, appStats, active, completed, messages]) => {
        setProfile(creatorProfile)
        setRecommended(campaigns.slice(0, 4))
        setActivity(recentActivity)
        setRecentMessages(messages)
        setStats({
          pending: appStats.pending,
          activeCollaborations: active,
          completed,
        })
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingState />

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Creator'

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your collaborations and opportunities at a glance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Active Collaborations"
          value={stats.activeCollaborations}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard label="Pending Applications" value={stats.pending} icon={<FileText className="h-5 w-5" />} />
        <StatCard
          label="Completed Collaborations"
          value={stats.completed}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Recent Messages"
          value={recentMessages.length}
          icon={<MessageCircle className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Recommended Opportunities</h2>
              <Link to="/creator/campaigns" className="text-sm font-medium text-brand-primary hover:text-brand-secondary">
                View all
              </Link>
            </div>
            {recommended.length === 0 ? (
              <p className="text-sm text-text-secondary">No active campaigns available.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {recommended.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Recent Messages</h2>
              <Link to="/creator/messages" className="text-sm font-medium text-brand-primary">
                View all
              </Link>
            </div>
            <Card padding="none">
              {recentMessages.length === 0 ? (
                <p className="px-4 py-6 text-sm text-text-secondary">No messages yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentMessages.map((conv) => (
                    <Link
                      key={conv.id}
                      to={`/creator/messages/${conv.id}`}
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-text-primary">{conv.other_party_name}</p>
                      <p className="text-xs text-text-secondary truncate">
                        {conv.last_message?.message ?? conv.last_message?.file_name ?? 'New conversation'}
                      </p>
                      {conv.last_message && (
                        <p className="text-[10px] text-text-secondary mt-1">
                          {formatRelativeTime(conv.last_message.created_at)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-4">Activity</h2>
            <Card padding="none">
              {activity.length === 0 ? (
                <p className="px-4 py-6 text-sm text-text-secondary">No recent activity.</p>
              ) : (
                <div className="divide-y divide-border">
                  {activity.map((item) => (
                    <div key={item.id} className="px-4 py-3">
                      <p className="text-sm text-text-primary">{item.text}</p>
                      <p className="text-xs text-text-secondary mt-1">{formatRelativeTime(item.time)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <Card>
            <div className="flex items-center gap-3">
              <Avatar src={profile?.avatar_url ?? undefined} name={profile?.full_name ?? 'Creator'} size="md" />
              <div>
                <p className="text-sm font-medium text-text-primary">{profile?.full_name ?? 'Creator'}</p>
                <p className="text-xs text-text-secondary">{formatFollowers(profile?.follower_count)} followers</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
