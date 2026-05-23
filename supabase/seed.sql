-- Insert sample products
INSERT INTO products (id, name, category, unit, image_url, is_active) VALUES
  (uuid_generate_v4(), 'Aashirvaad Whole Wheat Atta', 'Grocery', '10kg', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Amul Taaza Milk', 'Dairy', '1L', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Tata Salt', 'Grocery', '1kg', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Maggi 2-Minute Noodles', 'Snacks', '140g', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Lays India''s Magic Masala', 'Snacks', '52g', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Parle-G Gold', 'Snacks', '1kg', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Surf Excel Easy Wash', 'Cleaning', '1.5kg', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Colgate Strong Teeth', 'Personal Care', '200g', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'Fortune Sunlite Refined Sunflower Oil', 'Grocery', '1L', 'https://placeholder.co/400', true),
  (uuid_generate_v4(), 'India Gate Basmati Rice', 'Grocery', '5kg', 'https://placeholder.co/400', true);

-- Note: Admin/Shop Owner user seed requires a valid user in auth.users first.
-- For local testing, we will create dummy profiles and shops without strict auth linking 
-- IF we bypass foreign key constraints, or we just insert raw UUIDs.
-- Since profiles references auth.users(id), we CANNOT insert into profiles without a valid auth.users entry.
-- However, we CAN insert shops if we make owner_id NULL temporarily for testing, but let's assume we want to view shops.
-- We will insert shops with a random owner_id. It might fail if RLS or foreign keys are strictly enforced on insert.
-- A better approach for the frontend is to just fetch shops, so let's try to insert some dummy shops.

-- Insert some dummy shops (ensure owner_id constraint is deferred or we use a null owner if allowed)
-- In our schema, owner_id is UUID REFERENCES profiles(id) ON DELETE CASCADE, which defaults to nullable.
INSERT INTO shops (id, shop_name, address, location, pincode, is_approved, rating, total_orders) VALUES
  (uuid_generate_v4(), 'Sharma General Store', '12, MG Road, Sector 14', ST_SetSRID(ST_MakePoint(77.0266, 28.4595), 4326), '122001', true, 4.8, 120),
  (uuid_generate_v4(), 'Gupta Daily Needs', 'Shop No 4, Main Market', ST_SetSRID(ST_MakePoint(77.0300, 28.4600), 4326), '122001', true, 4.2, 45),
  (uuid_generate_v4(), 'Fresh Mart', 'Ground Floor, Galleria', ST_SetSRID(ST_MakePoint(77.0800, 28.4700), 4326), '122002', true, 4.5, 300);

-- Note: We also need to seed shop_inventory for these shops later, but this gives us shops to display on the home page!
