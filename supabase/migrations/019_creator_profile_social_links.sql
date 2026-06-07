-- Creator profile: username + extended social links (no self-reported stats editing)

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_profiles_username_lower
  ON public.creator_profiles (lower(username))
  WHERE username IS NOT NULL AND length(trim(username)) > 0;

COMMENT ON COLUMN public.creator_profiles.follower_count IS 'Reserved for verified platform integrations — not user-editable';
COMMENT ON COLUMN public.creator_profiles.average_views IS 'Reserved for verified platform integrations — not user-editable';
COMMENT ON COLUMN public.creator_profiles.average_likes IS 'Reserved for verified platform integrations — not user-editable';
COMMENT ON COLUMN public.creator_profiles.engagement_rate IS 'Reserved for verified platform integrations — not user-editable';
