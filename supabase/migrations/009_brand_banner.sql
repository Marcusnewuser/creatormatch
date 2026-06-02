-- Brand profile cover banner

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS banner_url TEXT;
