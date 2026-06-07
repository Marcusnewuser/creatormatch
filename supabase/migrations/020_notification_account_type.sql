-- Notification workspace separation: account_type column + message/submission alerts

-- ---------------------------------------------------------------------------
-- Rename role_context → account_type (idempotent)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'role_context'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN role_context TO account_type;
  END IF;
END $$;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_role_context_check;

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_account_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_account_type_check
  CHECK (account_type IN ('creator', 'brand', 'admin'));

COMMENT ON COLUMN public.notifications.account_type IS 'Workspace account: creator | brand | admin';
COMMENT ON COLUMN public.notifications.is_read IS 'Read status (false = unread)';

DROP INDEX IF EXISTS idx_notifications_user_role;
DROP INDEX IF EXISTS idx_notifications_user_role_unread;

CREATE INDEX IF NOT EXISTS idx_notifications_user_account_type
  ON public.notifications(user_id, account_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user_account_unread
  ON public.notifications(user_id, account_type, is_read)
  WHERE is_read = false;

-- ---------------------------------------------------------------------------
-- Expanded notification types
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
      'collaboration_invitation',
      'review_requested',
      'application_received',
      'application_withdrawn',
      'campaign_expiring',
      'campaign_closed',
      'new_message',
      'file_request',
      'content_submitted',
      'submission_approved',
      'admin_user_registered',
      'admin_campaign_created',
      'admin_report_submitted'
    )
  );

-- ---------------------------------------------------------------------------
-- Admin notifier
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, account_type)
  SELECT p.id, p_title, p_message, p_type, 'admin'
  FROM public.profiles p
  WHERE p.role = 'admin';
END;
$$;

-- ---------------------------------------------------------------------------
-- Application lifecycle (creator vs brand workspaces)
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

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
  VALUES (
    v_brand_id,
    'brand',
    'New application received',
    COALESCE(v_creator_name, 'A creator') || ' applied to "' || COALESCE(v_campaign_title, 'your campaign') || '".',
    'application_received'
  );

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
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
      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Application accepted',
        'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was accepted.',
        'application_accepted'
      );

      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'New collaboration invitation',
        COALESCE(v_brand_name, 'A brand') || ' invited you to collaborate on "' || COALESCE(v_campaign_title, 'a campaign') || '".',
        'collaboration_invitation'
      );

      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.brand_id,
        'brand',
        'Creator accepted invitation',
        COALESCE(v_creator_name, 'The creator') || ' is ready to collaborate on "' || COALESCE(v_campaign_title, 'your campaign') || '".',
        'collaboration_invitation'
      );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Application update',
        'Your application for "' || COALESCE(v_campaign_title, 'a campaign') || '" was not selected.',
        'application_rejected'
      );
    ELSIF NEW.status = 'content_submitted' AND OLD.status = 'in_progress' THEN
      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.brand_id,
        'brand',
        'Creator submitted content',
        COALESCE(v_creator_name, 'The creator') || ' submitted content for "' || COALESCE(v_campaign_title, 'your campaign') || '".',
        'content_submitted'
      );
    ELSIF NEW.status = 'approved' AND OLD.status = 'content_submitted' THEN
      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Submission approved',
        'Your content for "' || COALESCE(v_campaign_title, 'a campaign') || '" was approved.',
        'submission_approved'
      );
    ELSIF NEW.status = 'pending_completion' AND OLD.status = 'in_progress' THEN
      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.creator_id,
        'creator',
        'Collaboration marked complete',
        COALESCE(v_brand_name, 'The brand') || ' marked this collaboration as completed.',
        'collaboration_marked_complete'
      );
    ELSIF NEW.status = 'completed' AND OLD.status = 'pending_completion' THEN
      INSERT INTO public.notifications (user_id, account_type, title, message, type)
      VALUES (
        NEW.brand_id,
        'brand',
        'Collaboration completed',
        COALESCE(v_creator_name, 'The creator') || ' confirmed completion for "' || COALESCE(v_campaign_title, 'your campaign') || '".',
        'collaboration_confirmed'
      );
    END IF;
  END IF;

  IF OLD.review_requested_at IS NULL AND NEW.review_requested_at IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, account_type, title, message, type)
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

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
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

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
  VALUES (
    p_creator_id,
    'creator',
    'Profile viewed',
    v_viewer_name || ' viewed your profile.',
    'profile_viewed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Chat messages → account-specific inbox
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_recipient_id UUID;
  v_account_type TEXT;
  v_type TEXT;
  v_title TEXT;
  v_preview TEXT;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_role = 'creator' OR (NEW.sender_role IS NULL AND NEW.sender_id = v_conv.creator_id) THEN
    v_recipient_id := v_conv.brand_id;
    v_account_type := 'brand';
  ELSE
    v_recipient_id := v_conv.creator_id;
    v_account_type := 'creator';
  END IF;

  IF v_recipient_id IS NULL OR v_recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  IF NEW.file_url IS NOT NULL THEN
    v_type := 'file_request';
    v_title := 'File shared in chat';
    v_preview := COALESCE(NEW.file_name, 'A file was shared in your collaboration chat.');
  ELSE
    v_type := 'new_message';
    v_title := 'New message';
    v_preview := COALESCE(NULLIF(trim(NEW.message), ''), 'You have a new message in your collaboration chat.');
    IF length(v_preview) > 140 THEN
      v_preview := left(v_preview, 137) || '...';
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
  VALUES (v_recipient_id, v_account_type, v_title, v_preview, v_type);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS messages_notify_recipient ON public.messages;
CREATE TRIGGER messages_notify_recipient
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ---------------------------------------------------------------------------
-- Campaign notifications (account_type column)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_campaign_recommended()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
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
    INSERT INTO public.notifications (user_id, account_type, title, message, type)
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
    INSERT INTO public.notifications (user_id, account_type, title, message, type)
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

  INSERT INTO public.notifications (user_id, account_type, title, message, type)
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
