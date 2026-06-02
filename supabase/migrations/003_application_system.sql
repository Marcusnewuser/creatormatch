-- Application system upgrade: creator_id, brand_id, message, updated RLS
-- Run in Supabase SQL Editor after 002_campaign_system.sql

-- ---------------------------------------------------------------------------
-- Add brand_id column and backfill from campaigns
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

UPDATE public.applications a
SET brand_id = c.brand_id
FROM public.campaigns c
WHERE a.campaign_id = c.id
  AND a.brand_id IS NULL;

-- ---------------------------------------------------------------------------
-- Rename creator_user_id → creator_id
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = 'creator_user_id'
  ) THEN
    ALTER TABLE public.applications RENAME COLUMN creator_user_id TO creator_id;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Rename motivation → message
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applications'
      AND column_name = 'motivation'
  ) THEN
    ALTER TABLE public.applications RENAME COLUMN motivation TO message;
  END IF;
END $$;

-- Ensure brand_id is required for new rows
ALTER TABLE public.applications
  ALTER COLUMN brand_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Update unique constraint (one application per creator per campaign)
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_campaign_id_creator_user_id_key;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_campaign_id_creator_id_key;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_campaign_id_creator_id_key UNIQUE (campaign_id, creator_id);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS idx_applications_creator_user_id;
CREATE INDEX IF NOT EXISTS idx_applications_creator_id ON public.applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_applications_brand_id ON public.applications(brand_id);

-- ---------------------------------------------------------------------------
-- Recreate applications RLS policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Creators can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Creators can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Creators can update own pending applications" ON public.applications;
DROP POLICY IF EXISTS "Creators can delete own pending applications" ON public.applications;
DROP POLICY IF EXISTS "Brands can update applications on own campaigns" ON public.applications;

CREATE POLICY "Creators can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR brand_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Creators can insert applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id
        AND c.brand_id = brand_id
        AND c.status = 'active'
    )
  );

CREATE POLICY "Creators can update own pending applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid() AND status = 'pending')
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete own pending applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid() AND status = 'pending');

CREATE POLICY "Brands can update applications on own campaigns"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (brand_id = auth.uid())
  WITH CHECK (brand_id = auth.uid());
