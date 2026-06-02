-- Dual-role notification context: separate creator vs brand notifications per user

-- ---------------------------------------------------------------------------
-- Schema: role_context + expanded notification types
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS role_context TEXT;

UPDATE public.notifications
SET role_context = CASE
  WHEN type = 'application_received' THEN 'brand'
  WHEN type IN ('application_accepted', 'application_rejected', 'campaign_created', 'campaign_recommended') THEN 'creator'
  ELSE 'creator'
END
WHERE role_context IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN role_context SET NOT NULL;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'application_submitted',
      'application_accepted',
      'application_rejected',
      'profile_viewed',
      'campaign_recommended',
      'application_received',
      'application_withdrawn',
      'campaign_expiring',
      'campaign_closed'
    )
  );

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_role_context_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_role_context_check CHECK (role_context IN ('creator', 'brand'));

UPDATE public.notifications
SET type = 'campaign_recommended'
WHERE type = 'campaign_created';

CREATE INDEX IF NOT EXISTS idx_notifications_user_role
  ON public.notifications(user_id, role_context);

CREATE INDEX IF NOT EXISTS idx_notifications_user_role_unread
  ON public.notifications(user_id, role_context, is_read)
  WHERE is_read = false;

-- Optional campaign deadline for expiring notifications
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS closes_at TIMESTAMPTZ;

-- Profile view deduplication (one notification per viewer per creator per day)
CREATE TABLE IF NOT EXISTS public.creator_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_profile_views_dedup
  ON public.creator_profile_views(creator_id, viewer_id, viewed_at DESC);

ALTER TABLE public.creator_profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own profile view log"
  ON public.creator_profile_views FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Trigger helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_application_received()
RETURNS TRIGGER AS $$
DECLARE
  v_brand_id UUID;
  v_campaign_title TEXT;
  v_creator_name TEXT;
BEGIN
  v_brand_id := COALESCE(NEW.brand_id, (
    SELECT c.brand_id FROM public.campaigns c WHERE c.id = NEW.campaign_id LIMIT 1
  ));

  IF v_brand_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.title INTO v_campaign_title
  FROM public.campaigns c
  WHERE c.id = NEW.campaign_id;

  SELECT cp.full_name INTO v_creator_name
  FROM public.creator_profiles cp
  WHERE cp.user_id = NEW.creator_id;

  INSERT INTO public.notifications (user_id, role_context, title, message, type)
  VALUES (
    v_brand_id,
    'brand',
    'New application received',
    COALESCE(v_creator_name, 'A creator') || ' applied to "' || COALESCE(v_campaign_title, 'your campaign') || '".',
    'application_received'
  );

  INSERT INTO public.notifications (user_id, role_context, title, message, type)
  VALUES (
    NEW.creator_id,
    'creator',
    'Application submitted',
    'Your application to "' || COALESCE(v_campaign_title, 'a campaign') || '" was submitted.',
    'application_submitted'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_title TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT c.title INTO v_campaign_title
  FROM public.campaigns c
  WHERE c.id = NEW.campaign_id;

  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, role_context, title, message, type)
    VALUES (
      NEW.creator_id,
      'creator',
      'Application accepted',
      'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was accepted.',
      'application_accepted'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, role_context, title, message, type)
    VALUES (
      NEW.creator_id,
      'creator',
      'Application update',
      'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was not selected.',
      'application_rejected'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_application_withdrawn()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_title TEXT;
  v_creator_name TEXT;
  v_brand_id UUID;
BEGIN
  v_brand_id := COALESCE(OLD.brand_id, (
    SELECT c.brand_id FROM public.campaigns c WHERE c.id = OLD.campaign_id LIMIT 1
  ));

  IF v_brand_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT c.title INTO v_campaign_title
  FROM public.campaigns c
  WHERE c.id = OLD.campaign_id;

  SELECT cp.full_name INTO v_creator_name
  FROM public.creator_profiles cp
  WHERE cp.user_id = OLD.creator_id;

  INSERT INTO public.notifications (user_id, role_context, title, message, type)
  VALUES (
    v_brand_id,
    'brand',
    'Application withdrawn',
    COALESCE(v_creator_name, 'A creator') || ' withdrew their application for "' || COALESCE(v_campaign_title, 'your campaign') || '".',
    'application_withdrawn'
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_campaign_recommended()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, role_context, title, message, type)
  SELECT
    cp.user_id,
    'creator',
    'Campaign recommended',
    '"' || NEW.title || '" was posted in ' || NEW.category || '.',
    'campaign_recommended'
  FROM public.creator_profiles cp
  WHERE cp.category = NEW.category
    AND cp.user_id <> NEW.brand_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_campaign_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    INSERT INTO public.notifications (user_id, role_context, title, message, type)
    SELECT
      cp.user_id,
      'creator',
      'Campaign recommended',
      '"' || NEW.title || '" was posted in ' || NEW.category || '.',
      'campaign_recommended'
    FROM public.creator_profiles cp
    WHERE cp.category = NEW.category
      AND cp.user_id <> NEW.brand_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_campaign_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
    INSERT INTO public.notifications (user_id, role_context, title, message, type)
    VALUES (
      NEW.brand_id,
      'brand',
      'Campaign closed',
      '"' || NEW.title || '" has been closed.',
      'campaign_closed'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_campaign_expiring()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.closes_at IS NULL OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF NEW.closes_at <= NOW() OR NEW.closes_at > NOW() + INTERVAL '7 days' THEN
    RETURN NEW;
  END IF;

  IF OLD.closes_at IS NOT DISTINCT FROM NEW.closes_at
     AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, role_context, title, message, type)
  VALUES (
    NEW.brand_id,
    'brand',
    'Campaign expiring soon',
    '"' || NEW.title || '" closes on ' || to_char(NEW.closes_at AT TIME ZONE 'UTC', 'Mon DD, YYYY') || '.',
    'campaign_expiring'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.record_creator_profile_view(p_creator_id UUID)
RETURNS VOID AS $$
DECLARE
  v_viewer_id UUID := auth.uid();
  v_viewer_name TEXT;
BEGIN
  IF v_viewer_id IS NULL OR v_viewer_id = p_creator_id THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.creator_profile_views
    WHERE creator_id = p_creator_id
      AND viewer_id = v_viewer_id
      AND viewed_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.creator_profile_views (creator_id, viewer_id)
  VALUES (p_creator_id, v_viewer_id);

  SELECT COALESCE(cp.full_name, split_part(p.email, '@', 1), 'Someone')
  INTO v_viewer_name
  FROM public.profiles p
  LEFT JOIN public.creator_profiles cp ON cp.user_id = p.id
  WHERE p.id = v_viewer_id;

  INSERT INTO public.notifications (user_id, role_context, title, message, type)
  VALUES (
    p_creator_id,
    'creator',
    'Profile viewed',
    v_viewer_name || ' viewed your profile.',
    'profile_viewed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.record_creator_profile_view(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS applications_notify_withdrawn ON public.applications;
CREATE TRIGGER applications_notify_withdrawn
  AFTER DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_withdrawn();

DROP TRIGGER IF EXISTS campaigns_notify_created ON public.campaigns;
CREATE TRIGGER campaigns_notify_created
  AFTER INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_campaign_recommended();

DROP TRIGGER IF EXISTS campaigns_notify_activated ON public.campaigns;
CREATE TRIGGER campaigns_notify_activated
  AFTER UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_campaign_activated();

DROP TRIGGER IF EXISTS campaigns_notify_closed ON public.campaigns;
CREATE TRIGGER campaigns_notify_closed
  AFTER UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_campaign_closed();

DROP TRIGGER IF EXISTS campaigns_notify_expiring ON public.campaigns;
CREATE TRIGGER campaigns_notify_expiring
  AFTER UPDATE OF closes_at, status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_campaign_expiring();

DROP FUNCTION IF EXISTS public.notify_campaign_created();
