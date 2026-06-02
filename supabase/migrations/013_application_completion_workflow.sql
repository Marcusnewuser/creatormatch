-- Step 2 of 2: Application completion workflow (columns, RLS, notifications).
-- Run AFTER 012_application_completion_workflow.sql has succeeded.

-- ---------------------------------------------------------------------------
-- Collaboration tracking columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS brand_marked_complete_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- RLS: creators can confirm or request review on pending_completion
-- ---------------------------------------------------------------------------
CREATE POLICY "Creators can respond to pending completion applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid() AND status = 'pending_completion')
  WITH CHECK (
    creator_id = auth.uid()
    AND status IN ('completed', 'pending_completion')
  );

-- ---------------------------------------------------------------------------
-- Extend notification types for collaboration workflow
-- ---------------------------------------------------------------------------
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
      'collaboration_marked_complete',
      'collaboration_confirmed',
      'review_requested',
      'application_received',
      'application_withdrawn',
      'campaign_expiring',
      'campaign_closed'
    )
  );

-- ---------------------------------------------------------------------------
-- Status change + collaboration notifications
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_title TEXT;
  v_brand_name TEXT;
  v_creator_name TEXT;
BEGIN
  SELECT c.title INTO v_campaign_title
  FROM public.campaigns c
  WHERE c.id = NEW.campaign_id;

  SELECT bp.company_name INTO v_brand_name
  FROM public.brand_profiles bp
  WHERE bp.user_id = NEW.brand_id;

  SELECT cp.full_name INTO v_creator_name
  FROM public.creator_profiles cp
  WHERE cp.user_id = NEW.creator_id;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
      INSERT INTO public.notifications (user_id, role_context, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Application accepted',
        'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was accepted.',
        'application_accepted'
      );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      INSERT INTO public.notifications (user_id, role_context, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Application update',
        'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was not selected.',
        'application_rejected'
      );
    ELSIF NEW.status = 'pending_completion' AND OLD.status = 'in_progress' THEN
      INSERT INTO public.notifications (user_id, role_context, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Collaboration marked complete',
        COALESCE(v_brand_name, 'The brand') || ' marked this collaboration as completed.',
        'collaboration_marked_complete'
      );
    ELSIF NEW.status = 'completed' AND OLD.status = 'pending_completion' THEN
      INSERT INTO public.notifications (user_id, role_context, title, message, type)
      VALUES (
        NEW.brand_id,
        'brand',
        'Collaboration confirmed',
        COALESCE(v_creator_name, 'The creator') || ' confirmed completion for "' || COALESCE(v_campaign_title, 'your campaign') || '".',
        'collaboration_confirmed'
      );
    END IF;
  END IF;

  IF OLD.review_requested_at IS NULL AND NEW.review_requested_at IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, role_context, title, message, type)
    VALUES (
      NEW.brand_id,
      'brand',
      'Review requested',
      COALESCE(v_creator_name, 'The creator') || ' requested a review for "' || COALESCE(v_campaign_title, 'your campaign') || '".',
      'review_requested'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
