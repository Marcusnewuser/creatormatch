import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, FileText, Heart, MapPin, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../contexts/AuthContext'
import {
  deleteCreatorPost,
  fetchPostById,
  formatPostMetric,
  hasUserLikedPost,
  likePost,
  trackPostView,
  unlikePost,
} from '../lib/api'
import { requireSupabase } from '../lib/supabase'
import type { CreatorPost, CreatorProfile } from '../types/database'
import { cn } from '../lib/utils'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post, setPost] = useState<CreatorPost | null>(null)
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwner = user?.id === post?.creator_id

  const loadPost = useCallback(async () => {
    if (!postId) return
    setLoading(true)
    try {
      const fetched = await fetchPostById(postId)
      if (!fetched) {
        setPost(null)
        return
      }

      const { data: creatorProfile } = await requireSupabase()
        .from('creator_profiles')
        .select('*')
        .eq('user_id', fetched.creator_id)
        .maybeSingle()

      setPost(fetched)
      setCreator(creatorProfile)

      if (user) {
        setLiked(await hasUserLikedPost(postId, user.id))
      }

      const viewed = await trackPostView(postId)
      if (viewed) {
        setPost((p) => (p ? { ...p, views_count: p.views_count + 1 } : p))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }, [postId, user])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  async function handleLikeToggle() {
    if (!user || !postId || !post) return
    setLiking(true)
    try {
      if (liked) {
        await unlikePost(postId, user.id)
        setLiked(false)
        setPost({ ...post, likes_count: Math.max(post.likes_count - 1, 0) })
      } else {
        await likePost(postId, user.id)
        setLiked(true)
        setPost({ ...post, likes_count: post.likes_count + 1 })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like')
    } finally {
      setLiking(false)
    }
  }

  async function handleDelete() {
    if (!user || !post || !window.confirm('Delete this post permanently?')) return
    setDeleting(true)
    try {
      await deleteCreatorPost(user.id, post.id)
      navigate('/creator/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
      setDeleting(false)
    }
  }

  if (loading) return <div className="px-4 pt-6"><LoadingState /></div>

  if (!post) {
    return (
      <div className="px-4 pt-6 pb-8">
        <PageHeader title="Post" back />
        <EmptyState icon={FileText} title="Post not found" description="This post may have been removed." />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <PageHeader title={post.title} subtitle={post.category} back />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card padding="none" className="overflow-hidden mb-4">
        <div className="aspect-square sm:aspect-video bg-gray-100">
          {post.thumbnail_url ? (
            <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center text-text-secondary">
              No cover image
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Badge variant="primary">{post.category}</Badge>
        <button
          type="button"
          onClick={handleLikeToggle}
          disabled={liking || !user}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
            liked
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-border bg-white text-text-primary hover:border-red-200',
          )}
        >
          <Heart className={cn('h-5 w-5', liked && 'fill-current')} />
          {formatPostMetric(post.likes_count)}
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-text-secondary">
          <Eye className="h-5 w-5" />
          {formatPostMetric(post.views_count)}
        </div>
      </div>

      {post.description && (
        <Card className="mb-4">
          <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{post.description}</p>
        </Card>
      )}

      {creator && (
        <Card>
          <h2 className="text-sm font-medium text-text-secondary mb-3">Creator</h2>
          <Link
            to={`/creators/${post.creator_id}`}
            className="flex items-center gap-3 group"
          >
            <Avatar
              src={creator.avatar_url ?? undefined}
              name={creator.full_name ?? 'Creator'}
              size="lg"
            />
            <div className="min-w-0">
              <p className="font-semibold text-text-primary group-hover:text-brand-primary transition-colors truncate">
                {creator.full_name ?? 'Creator'}
              </p>
              {creator.category && (
                <Badge variant="primary" className="mt-1">{creator.category}</Badge>
              )}
              {creator.location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                  <MapPin className="h-3 w-3" />
                  {creator.location}
                </p>
              )}
            </div>
          </Link>
        </Card>
      )}

      {isOwner && (
        <div className="mt-6 flex gap-3">
          <Link to={`/creator/posts/${post.id}/edit`} className="flex-1">
            <Button variant="outline" fullWidth>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" fullWidth loading={deleting} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}
