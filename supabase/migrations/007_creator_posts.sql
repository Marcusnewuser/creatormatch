-- Native creator posts system (replaces featured posts & portfolio gallery)

DROP TABLE IF EXISTS public.creator_portfolio_items CASCADE;
DROP TABLE IF EXISTS public.creator_featured_posts CASCADE;

-- ---------------------------------------------------------------------------
-- creator_posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_posts_creator_id ON public.creator_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_posts_created_at ON public.creator_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_posts_category ON public.creator_posts(category);

ALTER TABLE public.creator_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view creator posts"
  ON public.creator_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Creators can insert own posts"
  ON public.creator_posts FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own posts"
  ON public.creator_posts FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete own posts"
  ON public.creator_posts FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- post_likes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view post likes"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike own likes"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Protect views_count / likes_count from manual client updates
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_creator_post_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('creatormatch.allow_metrics', true) IS DISTINCT FROM 'true' THEN
    NEW.views_count := OLD.views_count;
    NEW.likes_count := OLD.likes_count;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS creator_posts_protect_metrics ON public.creator_posts;
CREATE TRIGGER creator_posts_protect_metrics
  BEFORE UPDATE ON public.creator_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_creator_post_metrics();

-- Sync likes_count when post_likes rows change
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_config('creatormatch.allow_metrics', 'true', true);
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS post_likes_sync ON public.post_likes;
CREATE TRIGGER post_likes_sync
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

-- System-only view increment
CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('creatormatch.allow_metrics', 'true', true);
  UPDATE public.creator_posts
  SET views_count = views_count + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_post_view(UUID) TO authenticated;

DROP TRIGGER IF EXISTS creator_posts_updated_at ON public.creator_posts;
CREATE TRIGGER creator_posts_updated_at
  BEFORE UPDATE ON public.creator_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
