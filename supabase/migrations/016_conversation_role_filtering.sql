-- Role-based message filtering uses existing columns:
--   Creator mode: conversations WHERE creator_id = auth.uid()
--   Brand mode:    conversations WHERE brand_id = auth.uid()
--
-- No role_context column is required on conversations; each row links one creator
-- user and one brand user. Dual-role accounts see separate lists by active mode.

-- Optional: tighten SELECT so users only see rows for their participant side
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;

CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid() OR brand_id = auth.uid());
