-- ============================================================
-- MIGRATION: Allow Shop Owners to insert custom products
-- Run this in your Supabase SQL Editor to allow shop owners
-- to create custom products.
-- ============================================================

-- 1. Drop existing products modification policy
DROP POLICY IF EXISTS "Only admins can modify products" ON products;
DROP POLICY IF EXISTS "Admins and shop owners can insert products" ON products;
DROP POLICY IF EXISTS "Only admins can update or delete products" ON products;

-- 2. Allow anyone to view products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

-- 3. Allow shop owners and admins to insert new custom products
CREATE POLICY "Admins and shop owners can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('shop_owner', 'admin')
        )
    );

-- 4. Restrict UPDATE and DELETE to Admins only
CREATE POLICY "Only admins can update or delete products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
