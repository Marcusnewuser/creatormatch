import { Download, FileText, Image as ImageIcon } from 'lucide-react'

interface ChatFileCardProps {
  fileUrl: string
  fileName: string
  isOwn?: boolean
}

function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
}

export function ChatFileCard({ fileUrl, fileName, isOwn }: ChatFileCardProps) {
  const image = isImageFile(fileName)

  return (
    <div
      className={
        isOwn
          ? 'rounded-[14px] border border-white/25 bg-white/15 overflow-hidden w-full max-w-full'
          : 'rounded-[14px] border border-border bg-gray-50 overflow-hidden w-full max-w-full'
      }
    >
      {image ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={fileUrl} alt={fileName} className="max-h-48 w-full object-cover" />
        </a>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <FileText
            className={`h-8 w-8 shrink-0 ${isOwn ? 'text-white' : 'text-brand-primary'}`}
          />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-text-primary'}`}>
              {fileName}
            </p>
            <p className={`text-xs ${isOwn ? 'text-white/70' : 'text-text-secondary'}`}>Document</p>
          </div>
        </div>
      )}
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        className={
          isOwn
            ? 'flex items-center justify-center gap-2 border-t border-white/20 px-3 py-2 text-xs font-medium hover:bg-white/10'
            : 'flex items-center justify-center gap-2 border-t border-border px-3 py-2 text-xs font-medium text-brand-primary hover:bg-white'
        }
      >
        {image ? <ImageIcon className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
        {image ? 'Open' : 'Download'}
      </a>
    </div>
  )
}
