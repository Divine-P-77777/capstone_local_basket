-- Enable Row-Level Security (RLS) on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- NOTE: spatial_ref_sys is a PostGIS system table owned by supabase_admin.
-- RLS cannot be enabled on it via SQL Editor (permission denied).
-- Fix via: Dashboard → Database → Extensions → postgis → change schema to "extensions"

-- shop_ratings: enable RLS (policies defined at bottom of file)
ALTER TABLE public.shop_ratings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON profiles;
CREATE POLICY "Users and admins can update profiles" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Shops Table Policies
DROP POLICY IF EXISTS "Shops are viewable by everyone" ON shops;
CREATE POLICY "Shops are viewable by everyone" ON shops
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can register a shop" ON shops;
CREATE POLICY "Authenticated users can register a shop" ON shops
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Shop owners can update their own shop" ON shops;
DROP POLICY IF EXISTS "Shop owners and admins can update shops" ON shops;
CREATE POLICY "Shop owners and admins can update shops" ON shops
    FOR UPDATE USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Products (Master Catalog) Policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can modify products" ON products;
CREATE POLICY "Admins and shop owners can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('shop_owner', 'admin')
        )
    );

CREATE POLICY "Only admins can update or delete products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. Shop Inventory Policies
CREATE POLICY "Inventory is viewable by everyone" ON shop_inventory
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage their inventory" ON shop_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = shop_inventory.shop_id AND owner_id = auth.uid()
        )
    );

-- 5. Orders Table Policies
CREATE POLICY "Customers can manage their own orders" ON orders
    FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Shops can manage orders assigned to them" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = orders.shop_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Shops can update order statuses" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM shops 
            WHERE id = orders.shop_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Delivery agents can view ready/active orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'delivery_agent'
        ) OR
        delivery_agent_id = auth.uid() OR
        (status = 'ready' AND delivery_agent_id IS NULL)
    );

CREATE POLICY "Delivery agents can update their accepted orders" ON orders
    FOR UPDATE USING (
        delivery_agent_id = auth.uid() OR
        (status = 'ready' AND delivery_agent_id IS NULL)
    );









-- Shop Inventory Policies customization below



-- 1. Drop the old inventory ALL policy to start clean
DROP POLICY IF EXISTS "Owners can manage their inventory" ON public.shop_inventory;

-- 2. Define explicit INSERT policy with WITH CHECK constraint
CREATE POLICY "Owners can insert their own inventory" ON public.shop_inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = shop_inventory.shop_id AND owner_id = auth.uid()
        )
    );

-- 3. Define explicit UPDATE policy
CREATE POLICY "Owners can update their own inventory" ON public.shop_inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = shop_inventory.shop_id AND owner_id = auth.uid()
        )
    );

-- 4. Define explicit DELETE policy
CREATE POLICY "Owners can delete their own inventory" ON public.shop_inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.shops 
            WHERE id = shop_inventory.shop_id AND owner_id = auth.uid()
        )
    );


-- ==========================================
-- 6. Order Items Policies
-- ==========================================
DROP POLICY IF EXISTS "Anyone involved can view order items" ON order_items;
CREATE POLICY "Anyone involved can view order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_items.order_id AND (
                customer_id = auth.uid() OR
                delivery_agent_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM shops 
                    WHERE id = orders.shop_id AND owner_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );

DROP POLICY IF EXISTS "Customers can insert their own order items" ON order_items;
CREATE POLICY "Customers can insert their own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_items.order_id AND customer_id = auth.uid()
        )
    );


-- ==========================================
-- 7. Delivery Assignments Policies
-- ==========================================
DROP POLICY IF EXISTS "View delivery assignments" ON delivery_assignments;
CREATE POLICY "View delivery assignments" ON delivery_assignments
    FOR SELECT USING (
        agent_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = delivery_assignments.order_id AND (
                customer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM shops 
                    WHERE id = orders.shop_id AND owner_id = auth.uid()
                )
            )
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Manage delivery assignments" ON delivery_assignments;
CREATE POLICY "Manage delivery assignments" ON delivery_assignments
    FOR ALL USING (
        agent_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ==========================================
-- 8. Earnings Policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own earnings" ON earnings;
CREATE POLICY "Users can view their own earnings" ON earnings
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Only admins can manage earnings" ON earnings;
CREATE POLICY "Only admins can manage earnings" ON earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ==========================================
-- 9. Notifications Policies
-- ==========================================
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());


-- ==========================================
-- 10. Disputes Policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view and create disputes" ON disputes;
CREATE POLICY "Users can view and create disputes" ON disputes
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can insert disputes" ON disputes;
CREATE POLICY "Users can insert disputes" ON disputes
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Only admins can resolve disputes" ON disputes;
CREATE POLICY "Only admins can resolve disputes" ON disputes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );


-- ==========================================
-- 11. Shop Ratings Policies
-- ==========================================

-- Anyone can read shop ratings (for display on shop pages)
DROP POLICY IF EXISTS "Anyone can view shop ratings" ON public.shop_ratings;
CREATE POLICY "Anyone can view shop ratings" ON public.shop_ratings
    FOR SELECT USING (true);

-- Authenticated users can submit a rating (uses user_id, not customer_id)
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
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
