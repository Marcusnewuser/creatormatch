-- Step 2 of 2: Collaboration chat, files, submissions (run after 014).

-- ---------------------------------------------------------------------------
-- Conversations & messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_creator ON public.conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_brand ON public.conversations(brand_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_content_check CHECK (
    (message IS NOT NULL AND length(trim(message)) > 0) OR file_url IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS public.conversation_reads (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Content submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_application ON public.submissions(application_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Auto-create conversation when application is accepted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_conversation_on_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.conversations (application_id, creator_id, brand_id)
    VALUES (NEW.id, NEW.creator_id, NEW.brand_id)
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS applications_create_conversation ON public.applications;
CREATE TRIGGER applications_create_conversation
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.create_conversation_on_accepted();

-- Backfill conversations for existing accepted+ applications
INSERT INTO public.conversations (application_id, creator_id, brand_id)
SELECT a.id, a.creator_id, a.brand_id
FROM public.applications a
WHERE a.status IN ('accepted', 'in_progress', 'pending_completion', 'content_submitted', 'approved', 'completed')
ON CONFLICT (application_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS: conversations
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid() OR brand_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: messages
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.creator_id = auth.uid() OR c.brand_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.creator_id = auth.uid() OR c.brand_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: conversation_reads
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own read state"
  ON public.conversation_reads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own read state"
  ON public.conversation_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own read state"
  ON public.conversation_reads FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS: submissions
-- ---------------------------------------------------------------------------
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.brand_id = auth.uid()
    )
  );

CREATE POLICY "Creators can insert submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
        AND a.creator_id = auth.uid()
        AND a.status = 'in_progress'
    )
  );

-- Creators: submit content (status update)
CREATE POLICY "Creators can submit content on in progress applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (creator_id = auth.uid() AND status = 'content_submitted');

-- Brands: approve content
CREATE POLICY "Brands can approve content submissions"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (brand_id = auth.uid() AND status = 'content_submitted')
  WITH CHECK (brand_id = auth.uid() AND status = 'approved');

-- Participants: mark complete from approved
CREATE POLICY "Participants can complete approved collaborations"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    status = 'approved'
    AND (creator_id = auth.uid() OR brand_id = auth.uid())
  )
  WITH CHECK (status = 'completed');

-- ---------------------------------------------------------------------------
-- Storage: collaboration-files
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('collaboration-files', 'collaboration-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Participants can upload collaboration files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'collaboration-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone authenticated can read collaboration files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'collaboration-files');

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
