-- ============================================================
-- CORRECTED: shop_ratings RLS Policies
-- Column is user_id (not customer_id)
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.shop_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ratings
DROP POLICY IF EXISTS "Anyone can view shop ratings" ON public.shop_ratings;
CREATE POLICY "Anyone can view shop ratings" ON public.shop_ratings
    FOR SELECT USING (true);

-- Authenticated users can submit a rating (uses user_id column)
DROP POLICY IF EXISTS "Customers can insert their own ratings" ON public.shop_ratings;
CREATE POLICY "Customers can insert their own ratings" ON public.shop_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can update only their own rating
DROP POLICY IF EXISTS "Customers can update their own ratings" ON public.shop_ratings;
CREATE POLICY "Customers can update their own ratings" ON public.shop_ratings
    FOR UPDATE USING (
        auth.uid() = user_id
    );

-- Admins can manage all ratings
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.shop_ratings;
CREATE POLICY "Admins can manage all ratings" ON public.shop_ratings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
