-- 1. Automatic Profile Sync Function
-- This function runs whenever a new account registers in auth.users,
-- creating a matching row inside the profiles table with their meta role choice.
-- Automatically maps the Host Admin email to the 'admin' role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, address)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
    new.phone,
    CASE 
      WHEN new.email = 'niteshbhagat725@gmail.com' THEN 'admin'
      ELSE COALESCE(new.raw_user_meta_data->>'role', 'customer')
    END,
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      role = CASE 
        WHEN new.email = 'niteshbhagat725@gmail.com' THEN 'admin'
        ELSE EXCLUDED.role
      END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute handle_new_user automatically on auth.users inserts
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



-- 1. Auto-generate profiles for any existing users that are missing them
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Shop Partner'), 
  'shop_owner' -- Sets role as shop_owner so they can register their business
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure existing Host Admin user is granted the 'admin' role
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'niteshbhagat725@gmail.com'
);

-- 3. Add missing profile columns if they don't exist (safe to re-run migrations)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

-- 4. Delivery agents start as not-approved (requires admin review)
--    Set is_approved = FALSE for any delivery_agent profiles missing it
UPDATE public.profiles
SET is_approved = FALSE
WHERE role = 'delivery_agent'
  AND is_approved IS NULL;

-- 5. Clear PostgREST schema cache to apply
NOTIFY pgrst, 'reload schema';
