-- Campaign system upgrade: brand_id, platform, updated RLS
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- ---------------------------------------------------------------------------
-- Rename brand_user_id → brand_id (if coming from v1 schema)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaigns'
      AND column_name = 'brand_user_id'
  ) THEN
    ALTER TABLE public.campaigns RENAME COLUMN brand_user_id TO brand_id;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Add platform column
-- ---------------------------------------------------------------------------
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS platform TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON public.campaigns(platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON public.campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON public.campaigns(brand_id);

-- ---------------------------------------------------------------------------
-- Recreate campaigns RLS policies (brand_id)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Brands can insert own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Brands can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Brands can delete own campaigns" ON public.campaigns;

CREATE POLICY "Authenticated users can view active campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR brand_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Brands can insert own campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (brand_id = auth.uid());

CREATE POLICY "Brands can update own campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (brand_id = auth.uid())
  WITH CHECK (brand_id = auth.uid());

CREATE POLICY "Brands can delete own campaigns"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (brand_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Recreate applications RLS policies referencing brand_id
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Creators can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Brands can update applications on own campaigns" ON public.applications;

CREATE POLICY "Creators can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    creator_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.brand_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Brands can update applications on own campaigns"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.brand_id = auth.uid()
    )
  );
