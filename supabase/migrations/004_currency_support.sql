-- Multi-country currency support
-- Run in Supabase SQL Editor after 003_application_system.sql

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT;

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT;

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_country ON public.campaigns(country);
CREATE INDEX IF NOT EXISTS idx_campaigns_currency ON public.campaigns(currency);
