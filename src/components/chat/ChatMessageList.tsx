import { useRef, useEffect } from 'react'
import { ChatMessageBubble } from './ChatMessageBubble'
import { formatRelativeTime } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { Message } from '../../types/database'

interface ChatMessageListProps {
  messages: Message[]
  currentUserId: string | undefined
  scrollAnchorRef?: React.RefObject<HTMLDivElement | null>
}

export function ChatMessageList({
  messages,
  currentUserId,
  scrollAnchorRef,
}: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const anchorRef = scrollAnchorRef ?? endRef

  useEffect(() => {
    anchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, anchorRef])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px]">
      <div className="flex flex-col w-full">
        {messages.map((msg, index) => {
          const isOwn = Boolean(currentUserId && msg.sender_id === currentUserId)
          const groupedWithPrev = messages[index - 1]?.sender_id === msg.sender_id

          return (
            <div
              key={msg.id}
              className={cn(
                'flex w-full',
                isOwn ? 'justify-end' : 'justify-start',
                groupedWithPrev ? 'mt-1' : index === 0 ? '' : 'mt-4',
              )}
            >
              <div
                className={cn(
                  'flex flex-col min-w-0 max-w-[80%] md:max-w-[65%]',
                  isOwn ? 'items-end' : 'items-start',
                )}
              >
                <ChatMessageBubble
                  message={msg.message}
                  fileUrl={msg.file_url}
                  fileName={msg.file_name}
                  isOwn={isOwn}
                />
                <time
                  dateTime={msg.created_at}
                  className={cn(
                    'mt-1 px-1 text-[11px] leading-none text-text-secondary',
                    isOwn ? 'text-right self-end' : 'text-left self-start',
                  )}
                >
                  {formatRelativeTime(msg.created_at)}
                </time>
              </div>
            </div>
          )
        })}
      </div>
      <div ref={anchorRef} className="h-px shrink-0" aria-hidden />
    </div>
  )
}
