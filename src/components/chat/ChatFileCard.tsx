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
          ? 'rounded-xl border border-white/20 bg-white/10 overflow-hidden max-w-[240px]'
          : 'rounded-xl border border-border bg-gray-50 overflow-hidden max-w-[240px]'
      }
    >
      {image ? (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={fileUrl} alt={fileName} className="max-h-48 w-full object-cover" />
        </a>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <FileText className="h-8 w-8 text-brand-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs opacity-70">Document</p>
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
