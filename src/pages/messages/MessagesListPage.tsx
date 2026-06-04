import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { fetchConversationsForUser } from '../../lib/api'
import { hasCollaborationTables } from '../../lib/schema'
import { formatRelativeTime } from '../../lib/constants'
import type { ConversationWithDetails } from '../../types/database'

export default function MessagesListPage() {
  const { user, activeMode } = useAuth()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/brand') ? '/brand' : '/creator'
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hasCollaborationTables().then(setReady)
  }, [])

  useEffect(() => {
    if (!user || !ready) {
      setLoading(false)
      return
    }
    fetchConversationsForUser(user.id)
      .then(setConversations)
      .finally(() => setLoading(false))
  }, [user, ready])

  if (!ready) {
    return (
      <div className="px-4 pt-6 pb-8">
        <PageHeader title="Messages" back />
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migrations <code className="text-xs">014</code> and <code className="text-xs">015</code> in
          Supabase to enable messaging.
        </div>
      </div>
    )
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <PageHeader
        title="Messages"
        subtitle={`${activeMode === 'brand' ? 'Brand' : 'Creator'} collaborations`}
        back
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="When a brand accepts your application, a chat opens here."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const preview = conv.last_message?.file_name
              ? `📎 ${conv.last_message.file_name}`
              : conv.last_message?.message ?? 'No messages yet'
            return (
              <Link
                key={conv.id}
                to={`${basePath}/messages/${conv.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 hover:border-brand-primary/30 transition-colors"
              >
                <Avatar
                  src={conv.other_party_avatar ?? undefined}
                  name={conv.other_party_name}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text-primary truncate">{conv.other_party_name}</p>
                    {conv.last_message && (
                      <span className="text-[10px] text-text-secondary shrink-0">
                        {formatRelativeTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{conv.campaign_title}</p>
                  <p className="text-sm text-text-secondary truncate mt-0.5">{preview}</p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge variant="primary" className="shrink-0">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
