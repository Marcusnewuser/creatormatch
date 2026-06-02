-- Dual profile mode: one account can have both creator and brand profiles.
-- primary_mode sets the initial dashboard preference only (not a lock).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_mode public.user_role;

UPDATE public.profiles
SET primary_mode = role
WHERE primary_mode IS NULL
  AND role IN ('creator', 'brand');

COMMENT ON COLUMN public.profiles.primary_mode IS
  'Preferred starting dashboard (creator or brand). Does not restrict which profiles can exist.';
