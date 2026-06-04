-- Step 1 of 2: New application_status values for content workflow.
-- Run alone in Supabase SQL Editor, then run 015_collaboration_system.sql.

ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'content_submitted';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'approved';
