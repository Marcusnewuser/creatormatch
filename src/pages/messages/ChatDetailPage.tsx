import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Paperclip, Send } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { CollaborationTimeline } from '../../components/collaboration/CollaborationTimeline'
import { ContentSubmissionForm } from '../../components/collaboration/ContentSubmissionForm'
import { SubmissionsList } from '../../components/collaboration/SubmissionsList'
import { ChatFileCard } from '../../components/chat/ChatFileCard'
import { useAuth } from '../../contexts/AuthContext'
import { useMessages } from '../../contexts/MessagesContext'
import {
  approveApplicationContent,
  completeCollaboration,
  fetchApplicationById,
  fetchConversationByIdForRole,
  fetchMessages,
  fetchSubmissionsForApplication,
  markConversationRead,
  resolveMessageRole,
  sendMessage,
  startCollaboration,
  subscribeToMessages,
  uploadCollaborationFile,
  applicationStatusLabel,
} from '../../lib/api'
import { requireSupabase } from '../../lib/supabase'
import { formatRelativeTime } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { ApplicationWithCreator, Message } from '../../types/database'
import type { Submission } from '../../types/database'

export default function ChatDetailPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user, activeMode, hasCreatorProfile, hasBrandProfile } = useAuth()
  const { refresh: refreshMessages } = useMessages()
  const messageRole = resolveMessageRole(activeMode, hasCreatorProfile, hasBrandProfile)
  const isBrand = messageRole === 'brand'
  const messagesBase = isBrand ? '/brand/messages' : '/creator/messages'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [application, setApplication] = useState<ApplicationWithCreator | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [otherName, setOtherName] = useState('')
  const [campaignTitle, setCampaignTitle] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadData = useCallback(async () => {
    if (!conversationId || !user) return
    const conv = await fetchConversationByIdForRole(conversationId, user.id, messageRole)
    if (!conv) {
      setError('This conversation is not available in your current mode')
      setLoading(false)
      return
    }

    const app = await fetchApplicationById(conv.application_id)
    if (!app) {
      setError('Application not found')
      setLoading(false)
      return
    }

    const [msgs, subs] = await Promise.all([
      fetchMessages(conversationId),
      fetchSubmissionsForApplication(conv.application_id),
    ])

    const [{ data: campaign }, { data: brandProfile }] = await Promise.all([
      requireSupabase().from('campaigns').select('title').eq('id', app.campaign_id).maybeSingle(),
      isBrand
        ? Promise.resolve({ data: null })
        : requireSupabase()
            .from('brand_profiles')
            .select('company_name')
            .eq('user_id', app.brand_id)
            .maybeSingle(),
    ])

    setApplication(app)
    setMessages(msgs)
    setSubmissions(subs)
    setCampaignTitle(campaign?.title ?? 'Campaign')
    setOtherName(
      isBrand
        ? app.creator_profiles?.full_name ?? 'Creator'
        : brandProfile?.company_name ?? 'Brand',
    )

    await markConversationRead(conversationId, user.id)
    refreshMessages().catch(() => undefined)
    setLoading(false)
    setTimeout(scrollToBottom, 100)
  }, [conversationId, user, messageRole, isBrand, scrollToBottom, refreshMessages])

  useEffect(() => {
    loadData()
  }, [loadData])

  const prevRoleRef = useRef(messageRole)
  useEffect(() => {
    if (prevRoleRef.current === messageRole) return
    prevRoleRef.current = messageRole
    if (!conversationId || !user) return
    fetchConversationByIdForRole(conversationId, user.id, messageRole).then((conv) => {
      if (!conv) {
        navigate(messagesBase, { replace: true })
      } else {
        loadData()
      }
    })
  }, [messageRole, conversationId, user, navigate, messagesBase, loadData])

  useEffect(() => {
    if (!conversationId) return
    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (user && msg.sender_id !== user.id) {
        markConversationRead(conversationId, user.id).catch(() => undefined)
      }
      setTimeout(scrollToBottom, 50)
    })
    return unsubscribe
  }, [conversationId, user, scrollToBottom])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!conversationId || !user || !text.trim()) return
    setSending(true)
    try {
      const msg = await sendMessage({
        conversationId,
        senderId: user.id,
        message: text.trim(),
      })
      setMessages((prev) => [...prev, msg])
      setText('')
      scrollToBottom()
      refreshMessages().catch(() => undefined)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !conversationId || !user) return
    e.target.value = ''
    setUploading(true)
    setError(null)
    try {
      const url = await uploadCollaborationFile(user.id, file)
      const msg = await sendMessage({
        conversationId,
        senderId: user.id,
        fileUrl: url,
        fileName: file.name,
        message: `Shared file: ${file.name}`,
      })
      setMessages((prev) => [...prev, msg])
      scrollToBottom()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  async function runAction(fn: () => Promise<void>) {
    setActionLoading(true)
    setError(null)
    try {
      await fn()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>
  if (!application) {
    return <div className="px-4 pt-6 text-text-secondary">{error ?? 'Not found'}</div>
  }

  const status = application.status

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] max-w-lg mx-auto">
      <div className="px-4 pt-4 shrink-0">
        <PageHeader
          title={otherName}
          subtitle={`${campaignTitle} · ${applicationStatusLabel(status)}`}
          back
        />
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <CollaborationTimeline status={status} className="mb-4" />

        {isBrand && status === 'accepted' && (
          <Button
            className="mb-4"
            fullWidth
            loading={actionLoading}
            onClick={() =>
              runAction(async () => {
                const updated = await startCollaboration(application.id)
                setApplication({ ...application, ...updated })
              })
            }
          >
            Start Collaboration
          </Button>
        )}

        {!isBrand && status === 'in_progress' && user && (
          <div className="mb-4 rounded-xl border border-border bg-white p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Submit Content</h3>
            <ContentSubmissionForm
              applicationId={application.id}
              creatorId={user.id}
              onSubmitted={() => loadData()}
            />
          </div>
        )}

        {isBrand && status === 'content_submitted' && (
          <Button
            className="mb-4"
            fullWidth
            loading={actionLoading}
            onClick={() =>
              runAction(async () => {
                const updated = await approveApplicationContent(application.id)
                setApplication({ ...application, ...updated })
              })
            }
          >
            Approve Content
          </Button>
        )}

        {status === 'approved' && (
          <Button
            className="mb-4"
            fullWidth
            variant="outline"
            loading={actionLoading}
            onClick={() =>
              runAction(async () => {
                const updated = await completeCollaboration(application.id)
                setApplication({ ...application, ...updated })
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Collaboration Complete
          </Button>
        )}

        {submissions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Content Submissions</h3>
            <SubmissionsList submissions={submissions} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
        {messages.map((msg) => {
          const own = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={cn('flex', own ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                  own
                    ? 'bg-brand-primary text-white rounded-br-md'
                    : 'bg-white border border-border text-text-primary rounded-bl-md',
                )}
              >
                {msg.file_url && msg.file_name && (
                  <div className="mb-2">
                    <ChatFileCard fileUrl={msg.file_url} fileName={msg.file_name} isOwn={own} />
                  </div>
                )}
                {msg.message && (
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                )}
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    own ? 'text-white/70' : 'text-text-secondary',
                  )}
                >
                  {formatRelativeTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-border bg-white px-4 py-3 pb-safe flex gap-2 items-end"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-gray-50"
          aria-label="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        />
        <Button type="submit" size="sm" loading={sending || uploading} disabled={!text.trim() && !uploading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
