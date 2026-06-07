-- Permanent completed collaboration history (survives campaign / application deletion)

CREATE TABLE IF NOT EXISTS public.collaboration_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE REFERENCES public.applications(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_title TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collaboration_completions_creator
  ON public.collaboration_completions(creator_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_collaboration_completions_brand
  ON public.collaboration_completions(brand_id, completed_at DESC);

COMMENT ON TABLE public.collaboration_completions IS
  'Immutable completed collaboration records; counts survive campaign deletion.';

-- ---------------------------------------------------------------------------
-- Record completion when application reaches completed status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_collaboration_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_title TEXT;
  v_brand_id UUID;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  v_brand_id := COALESCE(
    NEW.brand_id,
    (SELECT c.brand_id FROM public.campaigns c WHERE c.id = NEW.campaign_id LIMIT 1)
  );

  IF v_brand_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.title INTO v_campaign_title
  FROM public.campaigns c
  WHERE c.id = NEW.campaign_id;

  INSERT INTO public.collaboration_completions (
    application_id,
    campaign_id,
    creator_id,
    brand_id,
    campaign_title,
    completed_at
  )
  VALUES (
    NEW.id,
    NEW.campaign_id,
    NEW.creator_id,
    v_brand_id,
    v_campaign_title,
    COALESCE(NEW.completed_at, NOW())
  )
  ON CONFLICT (application_id) DO UPDATE SET
    campaign_id = EXCLUDED.campaign_id,
    campaign_title = COALESCE(EXCLUDED.campaign_title, collaboration_completions.campaign_title),
    completed_at = EXCLUDED.completed_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS applications_record_collaboration_completion ON public.applications;
CREATE TRIGGER applications_record_collaboration_completion
  AFTER UPDATE OF status, completed_at ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.record_collaboration_completion();

-- Backfill existing completed applications
INSERT INTO public.collaboration_completions (
  application_id,
  campaign_id,
  creator_id,
  brand_id,
  campaign_title,
  completed_at
)
SELECT
  a.id,
  a.campaign_id,
  a.creator_id,
  COALESCE(a.brand_id, c.brand_id),
  c.title,
  COALESCE(a.completed_at, a.updated_at, a.created_at)
FROM public.applications a
LEFT JOIN public.campaigns c ON c.id = a.campaign_id
WHERE a.status = 'completed'
ON CONFLICT (application_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.collaboration_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own collaboration completions"
  ON public.collaboration_completions FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid() OR brand_id = auth.uid());

CREATE POLICY "Admins can view all collaboration completions"
  ON public.collaboration_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
