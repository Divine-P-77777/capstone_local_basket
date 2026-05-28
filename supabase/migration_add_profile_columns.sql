-- ============================================================
-- MIGRATION: Add missing profile columns
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add is_online column for delivery agent availability toggle
-- 2. Add is_approved column for admin approval of delivery agents
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

-- 3. Delivery agents require explicit admin approval → set to FALSE
UPDATE public.profiles
SET is_approved = FALSE
WHERE role = 'delivery_agent'
  AND is_approved IS NULL;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFY: Run this to confirm columns were added
-- ============================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'profiles'
--   AND column_name IN ('is_online', 'is_approved');
