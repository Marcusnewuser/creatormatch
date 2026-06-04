import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
  fetchConversationsForRole,
  fetchUnreadCountsByRole,
  resolveMessageRole,
} from '../lib/collaborations'
import { hasCollaborationTables } from '../lib/schema'
import type { ConversationWithDetails, MessageRoleContext } from '../types/database'
import type { AppMode } from '../lib/account-mode'

interface MessagesContextValue {
  conversations: ConversationWithDetails[]
  unreadCount: number
  creatorUnreadCount: number
  brandUnreadCount: number
  activeRoleContext: MessageRoleContext
  loading: boolean
  ready: boolean
  refresh: () => Promise<void>
}

const MessagesContext = createContext<MessagesContextValue | undefined>(undefined)

function resolveRoleContext(
  activeMode: AppMode | null,
  hasCreatorProfile: boolean,
  hasBrandProfile: boolean,
): MessageRoleContext {
  return resolveMessageRole(activeMode, hasCreatorProfile, hasBrandProfile)
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user, activeMode, hasCreatorProfile, hasBrandProfile } = useAuth()
  const [conversationsByRole, setConversationsByRole] = useState<{
    creator: ConversationWithDetails[]
    brand: ConversationWithDetails[]
  }>({ creator: [], brand: [] })
  const [unreadByRole, setUnreadByRole] = useState({ creator: 0, brand: 0 })
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  const activeRoleContext = useMemo(
    () => resolveRoleContext(activeMode, hasCreatorProfile, hasBrandProfile),
    [activeMode, hasCreatorProfile, hasBrandProfile],
  )

  const conversations = conversationsByRole[activeRoleContext]
  const unreadCount = unreadByRole[activeRoleContext]

  const refresh = useCallback(async () => {
    if (!user || !ready) return

    const fetches: Promise<void>[] = []

    if (hasCreatorProfile) {
      fetches.push(
        fetchConversationsForRole(user.id, 'creator').then((items) => {
          setConversationsByRole((prev) => ({ ...prev, creator: items }))
        }),
      )
    } else {
      setConversationsByRole((prev) => ({ ...prev, creator: [] }))
    }

    if (hasBrandProfile) {
      fetches.push(
        fetchConversationsForRole(user.id, 'brand').then((items) => {
          setConversationsByRole((prev) => ({ ...prev, brand: items }))
        }),
      )
    } else {
      setConversationsByRole((prev) => ({ ...prev, brand: [] }))
    }

    fetches.push(
      fetchUnreadCountsByRole(user.id).then((counts) => {
        setUnreadByRole(counts)
      }),
    )

    await Promise.all(fetches)
  }, [user, ready, hasCreatorProfile, hasBrandProfile])

  useEffect(() => {
    hasCollaborationTables().then(setReady)
  }, [])

  useEffect(() => {
    if (!user || !ready) {
      setLoading(false)
      return
    }

    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [user, ready, activeRoleContext, refresh])

  const value = useMemo(
    () => ({
      conversations,
      unreadCount,
      creatorUnreadCount: unreadByRole.creator,
      brandUnreadCount: unreadByRole.brand,
      activeRoleContext,
      loading,
      ready,
      refresh,
    }),
    [
      conversations,
      unreadCount,
      unreadByRole,
      activeRoleContext,
      loading,
      ready,
      refresh,
    ],
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider')
  }
  return context
}
