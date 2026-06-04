import { useRef, useEffect } from 'react'
import { ChatMessageBubble } from './ChatMessageBubble'
import { formatRelativeTime } from '../../lib/constants'
import { isOutgoingChatMessage } from '../../lib/chat-message-utils'
import { cn } from '../../lib/utils'
import type { Message, MessageRoleContext } from '../../types/database'

interface ChatMessageListProps {
  messages: Message[]
  viewerRole: MessageRoleContext
  creatorId: string
  brandId: string
  scrollAnchorRef?: React.RefObject<HTMLDivElement | null>
}

export function ChatMessageList({
  messages,
  viewerRole,
  creatorId,
  brandId,
  scrollAnchorRef,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const anchorRef = scrollAnchorRef ?? endRef

  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, anchorRef])

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 min-h-[200px] bg-gray-50/40"
      role="log"
      aria-label="Chat messages"
    >
      <div className="w-full max-w-full">
        {messages.map((msg, index) => {
          const isOwn = isOutgoingChatMessage(msg, viewerRole, creatorId, brandId)
          const groupedWithPrev =
            index > 0 &&
            isOutgoingChatMessage(messages[index - 1], viewerRole, creatorId, brandId) === isOwn

          return (
            <div
              key={msg.id}
              className={cn('w-full max-w-full', groupedWithPrev ? 'mt-1.5' : index === 0 ? '' : 'mt-4')}
            >
              <div
                className={cn(
                  'w-fit max-w-[80%] md:max-w-[65%]',
                  isOwn ? 'ml-auto mr-0' : 'mr-auto ml-0',
                )}
              >
                <ChatMessageBubble
                  message={msg.message}
                  fileUrl={msg.file_url}
                  fileName={msg.file_name}
                  isOwn={isOwn}
                />
                <p
                  className={cn(
                    'mt-1 px-0.5 text-[11px] leading-none text-text-secondary',
                    isOwn ? 'text-right' : 'text-left',
                  )}
                >
                  <time dateTime={msg.created_at}>{formatRelativeTime(msg.created_at)}</time>
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <div ref={anchorRef} className="h-px shrink-0" aria-hidden />
    </div>
  )
}
