import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { LoadingState } from '../../components/ui/LoadingState'
import { NativeFileInput } from '../../components/ui/NativeFileInput'
import { useAuth } from '../../contexts/AuthContext'
import {
  createCreatorPost,
  fetchPostById,
  updateCreatorPost,
  uploadFile,
} from '../../lib/api'
import { CAMPAIGN_CATEGORIES } from '../../lib/constants'
import { hasCreatorPostsTable } from '../../lib/schema'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return 'Failed to save post'
}

export default function EditCreatorPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const coverInputId = useId()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [postsReady, setPostsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hasCreatorPostsTable().then(setPostsReady)
  }, [])

  useEffect(() => {
    if (!id || !user) return
    fetchPostById(id)
      .then((post) => {
        if (!post || post.creator_id !== user.id) {
          setError('Post not found or you do not have permission to edit it.')
          return
        }
        setTitle(post.title)
        setDescription(post.description ?? '')
        setCategory(post.category)
        setCoverUrl(post.thumbnail_url)
      })
      .finally(() => setLoading(false))
  }, [id, user])

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError(null)
    try {
      setCoverUrl(await uploadFile('portfolio', user.id, file))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !category || !title.trim()) return

    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      thumbnail_url: coverUrl,
    }

    try {
      if (isEdit && id) {
        await updateCreatorPost(user.id, id, payload)
        navigate(`/posts/${id}`)
      } else {
        const post = await createCreatorPost(user.id, payload)
        navigate(`/posts/${post.id}`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <PageHeader title={isEdit ? 'Edit Portfolio Post' : 'Add Portfolio Post'} back />

      {!postsReady && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migrations <code className="text-xs">007_creator_posts.sql</code> and{' '}
          <code className="text-xs">008_creator_posts_native.sql</code> in Supabase to enable posts.
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-border bg-white p-4 shadow-soft">
          {coverUrl && (
            <img
              src={coverUrl}
              alt="Cover preview"
              className="h-40 w-full rounded-xl object-cover border border-border"
            />
          )}
          <NativeFileInput
            id={coverInputId}
            label="Cover image"
            onChange={handleCoverChange}
            disabled={uploading}
            hint={uploading ? 'Uploading…' : 'Choose an image — JPG or PNG recommended'}
          />
        </div>

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this work for brands…"
        />
        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[
            { value: '', label: 'Select category' },
            ...CAMPAIGN_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          required
        />

        <Button type="submit" fullWidth size="lg" loading={saving} disabled={!postsReady || uploading}>
          {isEdit ? 'Save Post' : 'Add to Portfolio'}
        </Button>
      </form>
    </div>
  )
}
