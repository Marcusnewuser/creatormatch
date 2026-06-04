import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { createSubmission } from '../../lib/api'

interface ContentSubmissionFormProps {
  applicationId: string
  creatorId: string
  onSubmitted: () => void
}

export function ContentSubmissionForm({
  applicationId,
  creatorId,
  onSubmitted,
}: ContentSubmissionFormProps) {
  const [contentUrl, setContentUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createSubmission({
        application_id: applicationId,
        creator_id: creatorId,
        content_url: contentUrl,
        notes: notes || null,
      })
      setContentUrl('')
      setNotes('')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-text-secondary">
        Submit TikTok, Instagram Reel, Xiaohongshu, YouTube, or Facebook content URL.
      </p>
      {error && (
        <p className="text-sm text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">{error}</p>
      )}
      <Input
        label="Content URL"
        type="url"
        placeholder="https://..."
        value={contentUrl}
        onChange={(e) => setContentUrl(e.target.value)}
        required
      />
      <Textarea
        label="Notes"
        placeholder="Optional notes for the brand"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <Button type="submit" loading={loading} fullWidth>
        <Send className="h-4 w-4" />
        Submit Content
      </Button>
    </form>
  )
}
