-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean re-runs if needed)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS earnings CASCADE;
DROP TABLE IF EXISTS delivery_assignments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shop_inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles Table (Extended from Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT UNIQUE,
    role TEXT CHECK (role IN ('customer', 'shop_owner', 'delivery_agent', 'admin')),
    address TEXT,
    location GEOMETRY(Point, 4326),   -- For geospatial queries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Shops Table
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    address TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    pincode TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Products (Master Catalog)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT,                    -- kg, piece, liter, packet
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Shop_Inventory
CREATE TABLE shop_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    min_stock_alert INT DEFAULT 5,
    is_available BOOLEAN GENERATED ALWAYS AS (stock_quantity > 0) STORED,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id),
    shop_id UUID REFERENCES shops(id),
    delivery_agent_id UUID REFERENCES profiles(id),
    total_amount DECIMAL(10,2),
    status TEXT CHECK (status IN ('pending', 'accepted', 'ready', 'picked_up', 'delivered', 'cancelled', 'rejected')),
    delivery_address TEXT,
    customer_location GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Order_Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    price_at_order DECIMAL(10,2) NOT NULL
);

-- 7. Additional Tables
CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('assigned', 'accepted', 'rejected', 'completed'))
);

CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id), -- Shop owner or delivery agent
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Important Indexing (Performance Optimization)
CREATE INDEX idx_shops_location ON shops USING GIST(location);
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);

CREATE INDEX idx_shop_inventory_shop ON shop_inventory(shop_id);
CREATE INDEX idx_shop_inventory_product ON shop_inventory(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_inventory_available ON shop_inventory(shop_id, is_available);

-- Set up Realtime
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table shop_inventory;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table delivery_assignments;
