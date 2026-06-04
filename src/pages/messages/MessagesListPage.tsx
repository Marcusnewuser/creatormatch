import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { useMessages } from '../../contexts/MessagesContext'
import { formatRelativeTime } from '../../lib/constants'
import type { ConversationWithDetails } from '../../types/database'

function messagesBasePath(activeMode: string | null): string {
  return activeMode === 'brand' ? '/brand' : '/creator'
}

function emptyDescription(activeMode: string | null): string {
  return activeMode === 'brand'
    ? 'When you accept a creator application, a brand collaboration chat opens here.'
    : 'When a brand accepts your application, a creator collaboration chat opens here.'
}

export default function MessagesListPage() {
  const { activeMode } = useAuth()
  const { conversations, loading, ready, activeRoleContext, refresh } = useMessages()
  const basePath = messagesBasePath(activeMode)

  useEffect(() => {
    if (ready) refresh().catch(() => undefined)
  }, [ready, refresh])

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
        subtitle={`${activeRoleContext === 'brand' ? 'Brand' : 'Creator'} collaborations only`}
        back
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={`No ${activeRoleContext} messages`}
          description={emptyDescription(activeMode)}
        />
      ) : (
        <ConversationList conversations={conversations} basePath={basePath} />
      )}
    </div>
  )
}

function ConversationList({
  conversations,
  basePath,
}: {
  conversations: ConversationWithDetails[]
  basePath: string
}) {
  return (
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
  )
}
