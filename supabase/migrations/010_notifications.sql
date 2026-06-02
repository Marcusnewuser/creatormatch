-- Notification system

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'application_received',
      'application_accepted',
      'application_rejected',
      'campaign_created'
    )
  ),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read)
  WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Trigger helpers (SECURITY DEFINER — inserts bypass RLS)
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

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_brand_id,
    'New application received',
    COALESCE(v_creator_name, 'A creator') || ' applied to "' || COALESCE(v_campaign_title, 'your campaign') || '".',
    'application_received'
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
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.creator_id,
      'Application accepted',
      'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was accepted.',
      'application_accepted'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.creator_id,
      'Application update',
      'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was not selected.',
      'application_rejected'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_campaign_created()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT
    cp.user_id,
    'New campaign available',
    '"' || NEW.title || '" was posted in ' || NEW.category || '.',
    'campaign_created'
  FROM public.creator_profiles cp
  WHERE cp.category = NEW.category
    AND cp.user_id <> NEW.brand_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS applications_notify_received ON public.applications;
CREATE TRIGGER applications_notify_received
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_received();

DROP TRIGGER IF EXISTS applications_notify_status ON public.applications;
CREATE TRIGGER applications_notify_status
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_application_status_change();

DROP TRIGGER IF EXISTS campaigns_notify_created ON public.campaigns;
CREATE TRIGGER campaigns_notify_created
  AFTER INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_campaign_created();

-- Notify matching creators when a draft campaign goes active
CREATE OR REPLACE FUNCTION public.notify_campaign_activated()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT
      cp.user_id,
      'New campaign available',
      '"' || NEW.title || '" was posted in ' || NEW.category || '.',
      'campaign_created'
    FROM public.creator_profiles cp
    WHERE cp.category = NEW.category
      AND cp.user_id <> NEW.brand_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS campaigns_notify_activated ON public.campaigns;
CREATE TRIGGER campaigns_notify_activated
  AFTER UPDATE OF status ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_campaign_activated();

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
