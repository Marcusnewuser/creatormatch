-- Step 1 of 2: Add new application_status enum values.
-- Run this file ALONE in the Supabase SQL Editor, wait for success,
-- then run 013_application_completion_workflow.sql.
--
-- PostgreSQL requires new enum values to be committed before they can be
-- referenced in policies, functions, or constraints (error 55P04).

ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'pending_completion';
