import { ChatFileCard } from './ChatFileCard'
import { cn } from '../../lib/utils'

interface ChatMessageBubbleProps {
  message: string | null
  fileUrl: string | null
  fileName: string | null
  isOwn: boolean
}

export function ChatMessageBubble({
  message,
  fileUrl,
  fileName,
  isOwn,
}: ChatMessageBubbleProps) {
  const hasFile = Boolean(fileUrl && fileName)
  const text = message?.trim()
  const showText = Boolean(text) && !(hasFile && text?.startsWith('Shared file:'))

  if (!hasFile && !showText) return null

  return (
    <div
      className={cn(
        'w-full rounded-[18px] px-3.5 py-2.5 shadow-sm',
        isOwn
          ? 'bg-[#2563eb] text-white'
          : 'border border-[#e5e7eb] bg-white text-[#111827]',
      )}
    >
      {hasFile && fileUrl && fileName && (
        <div className={cn(showText && 'mb-2')}>
          <ChatFileCard fileUrl={fileUrl} fileName={fileName} isOwn={isOwn} />
        </div>
      )}
      {showText && text && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
      )}
    </div>
  )
}
