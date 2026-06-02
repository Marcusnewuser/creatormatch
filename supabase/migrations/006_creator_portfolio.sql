-- Creator portfolio: banner, stats, featured posts, gallery items

-- ---------------------------------------------------------------------------
-- Extend creator_profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS average_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC(6, 2) DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Featured posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_featured_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  platform TEXT NOT NULL,
  post_url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_featured_posts_profile
  ON public.creator_featured_posts(creator_profile_id);

ALTER TABLE public.creator_featured_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view featured posts"
  ON public.creator_featured_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Creators can insert own featured posts"
  ON public.creator_featured_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update own featured posts"
  ON public.creator_featured_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can delete own featured posts"
  ON public.creator_featured_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Portfolio gallery items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  category TEXT,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_portfolio_items_profile
  ON public.creator_portfolio_items(creator_profile_id);

ALTER TABLE public.creator_portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view portfolio items"
  ON public.creator_portfolio_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Creators can insert own portfolio items"
  ON public.creator_portfolio_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can update own portfolio items"
  ON public.creator_portfolio_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can delete own portfolio items"
  ON public.creator_portfolio_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER creator_featured_posts_updated_at
  BEFORE UPDATE ON public.creator_featured_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER creator_portfolio_items_updated_at
  BEFORE UPDATE ON public.creator_portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket for portfolio media
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Portfolio images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

CREATE POLICY "Users can upload portfolio files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own portfolio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own portfolio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
