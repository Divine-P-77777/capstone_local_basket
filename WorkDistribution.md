# 🛒 Local Basket — Capstone Project Work Distribution
### Final Submission Report

---

## 🧱 Actual Tech Stack (From Codebase)

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | **Next.js 16** (App Router) | SSR, file-based routing, layouts |
| UI | **React 19** + **Tailwind CSS v4** | Components & styling |
| Animation | **Framer Motion** | UI transitions |
| State Management | **Zustand** | Cart store, global state |
| Backend / BaaS | **Supabase** | Auth, DB, Realtime, Storage |
| Database | **PostgreSQL** + **PostGIS extension** | Relational data + geospatial queries |
| Mapping | **Leaflet.js + OpenStreetMap** | Delivery map with route polyline |
| Icons | **Lucide React** | Full icon system |
| PWA | **@ducanh2912/next-pwa** | Installable mobile experience |
| Deployment | **Vercel** (frontend) + **Supabase Cloud** (backend) | Production |

---

## 👥 Detailed Team Work Distribution

---

### 1. 🏗️ Nitesh Bhagat — Backend Architect & Project Lead

**Role:** System Architecture, Supabase Backend, Auth, DB Functions & Security

#### ✅ Completed Work
- Designed the full **Supabase backend** with 10 database tables: `profiles`, `shops`, `products`, `shop_inventory`, `orders`, `order_items`, `delivery_assignments`, `earnings`, `notifications`, `disputes`
- Enabled **PostGIS** extension for geospatial support — powers location-based shop discovery using `GEOMETRY(Point, 4326)` columns on both shops and customer locations
- Built the **auto-profile sync DB trigger** (`handle_new_user`) — every new Supabase Auth registration automatically creates a profile row with the correct role (`customer`, `shop_owner`, `delivery_agent`, `admin`)
- Hard-coded admin role assignment logic directly in the DB trigger for the project admin email (`niteshbhagat725@gmail.com`)
- Wrote all **SQL migration files**: `migration_add_delivery_otp.sql`, `migration_add_profile_columns.sql`, `migration_fix_rls_warnings.sql`, `migration_add_custom_product_policy.sql`
- Authored the full `supabase/policies.sql` — Row Level Security (RLS) ensuring each role can only read/write their own data; service role bypasses for admin operations
- Set up **GIST spatial indexes** on `shops.location` and `profiles.location` for performant geographic queries
- Configured **Supabase Realtime** publications on 5 tables: `orders`, `shop_inventory`, `notifications`, `delivery_assignments`, `disputes`
- Architected the `src/lib/supabase/` module — browser client (`client.ts`), server-side client (`server.ts`), and SSR **middleware** (`middleware.ts`) with session refresh and role-based route protection

#### 📦 Key Files Owned
`supabase/tables.sql` · `supabase/functions.sql` · `supabase/policies.sql` · all `migration_*.sql` · `src/lib/supabase/client.ts` · `server.ts` · `middleware.ts`

#### 📊 Progress: ✅ 100% Complete

---

### 2. 🗄️ Amit Baruah — Database Designer & Schema Architect

**Role:** Data Modelling, Table Relationships, Inventory Design, Seed Data

#### ✅ Completed Work
- Designed the full **normalized relational schema** across all 10 tables with correct foreign keys, `ON DELETE CASCADE` rules, and data integrity constraints
- Architected the `shop_inventory` join table with a **computed column** `is_available GENERATED ALWAYS AS (stock_quantity > 0) STORED` — auto-calculates availability without application logic
- Designed the **Orders lifecycle** — the `orders.status` field enforces 8 valid states via `CHECK` constraint: `pending → accepted → ready → arrived_at_shop → picked_up → delivered → cancelled → rejected`
- Designed `order_items` with `price_at_order` snapshot — historical order prices are preserved even if product prices change in the future
- Designed the `earnings` table to track per-transaction revenue for both shop owners and delivery agents
- Created `disputes` table for customer complaint resolution, linked to both `orders` and `profiles`
- Created `delivery_assignments` table with its own status lifecycle: `assigned → accepted → rejected → completed`
- Set up **11 performance indexes** for all high-traffic query patterns (orders by customer, shop, status, inventory by availability, disputes by order/user)
- Built `supabase/seed.sql` to populate the initial master product catalog

#### 📦 Key Files Owned
`supabase/tables.sql` (schema design) · `supabase/seed.sql`

#### 📊 Progress: ✅ 100% Complete — All tables live on Supabase Cloud

---

### 3. ⚙️ Tonish Bhardwaj — API Integration & Data Layer Developer

**Role:** Supabase query integration, product APIs, shop-side data flows

#### ✅ Completed Work
- Implemented all **product/inventory Supabase query integrations** on the frontend:
  - Fetching shop products with live inventory via a `shop_inventory` ↔ `products` join query
  - Filtering only available products (`is_available = true`) for the customer-facing shop detail page
- Built the **Shop Owner Inventory management** (`/shop/inventory`) — shop owners update stock quantities using `+/-` controls, triggering Supabase upserts in real time
- Integrated **Supabase Realtime subscriptions** on the shop dashboard so new incoming orders appear live without any page refresh
- Connected the **Shop Dashboard** to Supabase: today's order count, pending orders, and low-stock alerts
- Developed the **Shop Earnings page** (`/shop/earnings`) — queries the `earnings` table and displays transaction history
- Built the **Admin Master Product Catalog** (`/admin/products`) — create, activate, and deactivate platform-wide products
- Wired up **order placement** — when a customer checks out, system atomically inserts into both `orders` and `order_items`
- Implemented `shop/inventory` product search and filter by category

#### 📦 Key Files Owned
`src/app/shop/inventory/` · `src/app/shop/dashboard/` · `src/app/shop/earnings/` · `src/app/admin/products/`

#### 📊 Progress: ✅ Core features complete. Minor edge-case polish pending.

---

### 4. 🎨 Vinayak Bhambri — Frontend UI Engineer (Customer & Shop Portal)

**Role:** UI Design System, Customer Portal, Shop Owner Portal, Auth Pages

#### ✅ Completed Work
- Built the **Customer Home Page** (`/home`) — live shop listing fetched from Supabase (`shops` table filtered by `is_approved = true`), skeleton loaders, category horizontal scroll strip, responsive 3-column grid
- Developed the **Shop Detail Page** (`/shop/[id]`) — shop info, live product listing from `shop_inventory`, Add-to-Cart button per item
- Built the **Customer Cart Page** (`/cart`) — item list with quantity controls, total amount calculation, order placement trigger
- Built the **Customer Orders Page** (`/orders`) — live order status tracker with visual step-by-step progress
- Built the **Customer Profile Page** (`/profile`) — edit full name, address, phone backed by Supabase profile update
- Designed the complete **Shop Owner portal UI**:
  - `shop/layout.tsx` — sticky top header with desktop nav links and mobile bottom navigation bar
  - Shop Dashboard widgets and order status breakdown
- Designed the **Authentication pages** (`/login`, `/register`, `/pending-approval`) with role-selection and Supabase Email/OTP login
- Established the **design system** — Tailwind CSS color tokens (`brand`, `accent`), typography scale, card/button component patterns
- Made every layout **fully responsive** — mobile-first sticky headers, bottom navigation bars on mobile, sidebar on desktop

#### 📦 Key Files Owned
`src/app/(customer)/home/page.tsx` · `src/app/(customer)/shop/` · `cart/` · `orders/` · `profile/` · `src/app/shop/layout.tsx` · `src/app/(auth)/` · `src/app/globals.css`

#### 📊 Progress: ✅ 100% UI Complete. Data wired for home and shop pages.

---

### 5. 🔗 Ujjwal Bharat — Frontend Integration Engineer, Delivery Portal & Admin Panel

**Role:** Delivery agent portal, interactive map, Zustand cart, admin panel, realtime

#### ✅ Completed Work
- Built the **entire Delivery Agent Portal**:
  - Delivery Dashboard (`/delivery/dashboard`) — available order requests, accept/reject flow, active delivery view with OTP confirmation
  - Delivery History (`/delivery/history`) — completed deliveries log with earnings
  - `delivery/layout.tsx` — dark slate header with mobile bottom nav
- Integrated the **live delivery map** (`src/components/MapComponent.tsx`) using **Leaflet.js + OpenStreetMap**:
  - Parses PostGIS `GEOMETRY(Point, 4326)` columns from Supabase (handles both GeoJSON and WKT string formats)
  - Renders **shop marker** and **customer marker** with custom icons
  - Draws a dashed green **Polyline route** between shop and customer locations
  - Fully SSR-safe using Next.js `"use client"` dynamic import pattern
- Implemented the **Zustand cart store** (`src/store/useCart.ts`) — add/remove items, update quantities, cart total, clear on order completion
- Built the complete **Admin Panel** (6 sections):
  - `admin/layout.tsx` — fixed sidebar with icon navigation
  - Admin Dashboard — platform-wide stats (total orders, shops, agents, revenue)
  - Users & Shops Management — approve/reject shop owners and delivery agents
  - Orders Management — full order visibility, status override
  - Reports — sales and platform analytics
  - Disputes — complaint list with resolution controls
- Integrated **Supabase Realtime** on the delivery dashboard so order requests pop up instantly
- Built `src/proxy.ts` for any proxying needs

#### 📦 Key Files Owned
`src/app/delivery/` · `src/components/MapComponent.tsx` · `src/store/useCart.ts` · `src/app/admin/`

#### 📊 Progress: ✅ Delivery portal, map, Zustand store, and admin panel all complete.

---

## 📊 Presentation (PPT) Content

### Title
**Local Basket — A Hyper-Local Kirana Store Discovery & Delivery Platform**

---

### Problem Statement
- Local Kirana stores have zero digital presence — customers can't discover them online
- No real-time visibility of what's in stock at nearby shops
- Delivery partners have no dedicated, platform-managed workflow
- Existing apps (Blinkit, Zepto) serve corporate dark stores, not real local shops

---

### Our Solution
Local Basket is a **full-stack, role-based local commerce platform** that connects 4 types of users:
- **Customer** — browse nearby stores, add to cart, place & track orders live
- **Shop Owner** — manage inventory, accept/reject orders, track earnings
- **Delivery Agent** — accept delivery jobs, navigate via live map, mark delivery steps
- **Admin** — approve shops/agents, manage all orders, resolve disputes, view reports

---

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                Next.js 16 Frontend                   │
│     Customer  │  Shop Owner  │  Delivery  │  Admin   │
└───────────────────────┬──────────────────────────────┘
                        │  Supabase Client SDK (SSR)
┌───────────────────────▼──────────────────────────────┐
│                Supabase (BaaS)                       │
│  Auth │ PostgreSQL + PostGIS │ Realtime │ Storage    │
└──────────────────────────────────────────────────────┘
         │ Leaflet.js     │ Zustand     │ next-pwa
     Live Map          Cart State    PWA Install
```

---

### Key Technical Features

| Feature | How It Works |
|---|---|
| Role-based auth | Supabase Auth + DB trigger auto-assigns role on signup |
| Location-based discovery | PostGIS `GEOMETRY(Point, 4326)` + GIST spatial index |
| Auto inventory availability | Computed DB column: `stock_quantity > 0` |
| Live order tracking | Supabase Realtime WebSocket subscriptions |
| Delivery route map | Leaflet.js parses PostGIS geometry, draws Polyline |
| Cart persistence | Zustand store (client-side, cleared on order placement) |
| Admin dispute resolution | `disputes` table + full admin panel UI |
| PWA | Installable on mobile via `next-pwa` |

---

### How It Is Better Than Alternatives

| Aspect | Blinkit / Zepto | **Local Basket** |
|---|---|---|
| Shop type | Corporate dark stores | Real local Kirana shops |
| Merchant onboarding | Internal / invite-only | Any shop owner can self-register |
| Coverage model | City-scale distribution hubs | True neighborhood hyper-local |
| Admin transparency | None for public | Full admin dashboard |
| Delivery model | In-house fleet | Any approved local agent |
| Tech openness | Closed proprietary | Open: Next.js + Supabase |

---

### Current Progress Summary

| Module | Owner | Status |
|---|---|---|
| Database Schema & Migrations | Amit + Nitesh | ✅ Complete |
| Auth System & Role Triggers | Nitesh | ✅ Complete |
| Row Level Security Policies | Nitesh | ✅ Complete |
| Supabase Realtime Setup | Nitesh + Ujjwal | ✅ Complete |
| Product & Inventory APIs | Tonish | ✅ Complete |
| Customer Portal UI | Vinayak | ✅ Complete |
| Shop Owner Portal | Vinayak + Tonish | ✅ Complete |
| Delivery Agent Portal | Ujjwal | ✅ Complete |
| Live Delivery Map (Leaflet) | Ujjwal | ✅ Complete |
| Admin Panel | Ujjwal | ✅ Complete |
| Zustand Cart State | Ujjwal | ✅ Complete |
| PWA Configuration | Nitesh | ✅ Complete |
| Vercel Deployment | Nitesh | ✅ Live |

---

### Future Roadmap

1. **Google Maps API** — Replace OpenStreetMap with Google Maps for turn-by-turn navigation, ETA, and Street View
2. **Live Agent Location Tracking** — Delivery agent GPS streams to customer via Supabase Realtime + PostGIS `ST_Distance`
3. **Payment Gateway** — Razorpay/UPI integrated checkout
4. **Push Notifications** — Web Push API / Firebase for order status alerts
5. **AI Product Recommendations** — ML model based on customer purchase history
6. **Store Analytics Dashboard** — Charts for peak hours, best-selling products, revenue trends per shop