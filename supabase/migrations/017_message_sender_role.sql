-- Track which side of the collaboration sent each message (required for dual-role accounts).

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_role TEXT
  CHECK (sender_role IS NULL OR sender_role IN ('creator', 'brand'));

CREATE INDEX IF NOT EXISTS idx_messages_sender_role ON public.messages(conversation_id, sender_role);
