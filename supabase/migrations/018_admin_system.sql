-- Admin panel: suspension, reports, RLS, admin notifications
-- profiles.role is the role_type (creator | brand | admin)

-- ---------------------------------------------------------------------------
-- Profiles: suspension + role_type documentation
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.role IS 'role_type: creator, brand, or admin';

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (
    report_type IN ('fake_brand', 'fake_creator', 'spam', 'abuse')
  ),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Admin helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- Notify all admins (SECURITY DEFINER)
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
  INSERT INTO public.notifications (user_id, title, message, type, role_context)
  SELECT p.id, p_title, p_message, p_type, 'admin'
  FROM public.profiles p
  WHERE p.role = 'admin';
END;
$$;

-- ---------------------------------------------------------------------------
-- Expand notifications for admin
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_role_context_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_role_context_check
  CHECK (role_context IN ('creator', 'brand', 'admin'));

-- Normalize legacy notification types before re-applying CHECK
UPDATE public.notifications
SET type = 'campaign_recommended'
WHERE type = 'campaign_created';

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      -- Creator / brand (from 011 + 013)
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
      'campaign_closed',
      -- Admin (018)
      'admin_user_registered',
      'admin_campaign_created',
      'admin_report_submitted'
    )
  );

-- ---------------------------------------------------------------------------
-- Reports RLS
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND NOT public.is_admin());

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin read/update policies (additive — existing policies unchanged)
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all creator profiles"
  ON public.creator_profiles FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update creator profiles"
  ON public.creator_profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete creator profiles"
  ON public.creator_profiles FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all brand profiles"
  ON public.brand_profiles FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update brand profiles"
  ON public.brand_profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete brand profiles"
  ON public.brand_profiles FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all campaigns"
  ON public.campaigns FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update all campaigns"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete campaigns"
  ON public.campaigns FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all submissions"
  ON public.submissions FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all creator posts"
  ON public.creator_posts FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can delete creator posts"
  ON public.creator_posts FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin notification triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admins_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM 'admin' THEN
    PERFORM public.notify_admins(
      'New user registered',
      COALESCE(NEW.email, 'A user') || ' joined CreatorMatch.',
      'admin_user_registered'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_notify_admins_new_user ON public.profiles;
CREATE TRIGGER profiles_notify_admins_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_user();

CREATE OR REPLACE FUNCTION public.notify_admins_new_campaign()
RETURNS TRIGGER AS $$
DECLARE
  v_brand_name TEXT;
BEGIN
  SELECT bp.company_name INTO v_brand_name
  FROM public.brand_profiles bp
  WHERE bp.user_id = NEW.brand_id;

  PERFORM public.notify_admins(
    'New campaign created',
    COALESCE(v_brand_name, 'A brand') || ' created "' || COALESCE(NEW.title, 'campaign') || '".',
    'admin_campaign_created'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS campaigns_notify_admins ON public.campaigns;
CREATE TRIGGER campaigns_notify_admins
  AFTER INSERT ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_campaign();

CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.notify_admins(
    'New report submitted',
    'A ' || NEW.report_type || ' report needs review.',
    'admin_report_submitted'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS reports_notify_admins ON public.reports;
CREATE TRIGGER reports_notify_admins
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_new_report();
