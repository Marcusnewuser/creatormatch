-- Native portfolio posts: remove external platform links, add category

ALTER TABLE public.creator_posts
  ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE public.creator_posts
SET category = COALESCE(NULLIF(category, ''), 'General')
WHERE category IS NULL;

ALTER TABLE public.creator_posts
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.creator_posts
  DROP COLUMN IF EXISTS original_post_url,
  DROP COLUMN IF EXISTS platform;

CREATE INDEX IF NOT EXISTS idx_creator_posts_category ON public.creator_posts(category);
