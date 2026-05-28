"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { PackageOpen, Check, X, Clock, ShoppingBag, Store, MapPin, Phone, Building, AlertCircle, Search, Filter, TrendingUp, ChevronLeft, ChevronRight, Eye } from "lucide-react";

export default function ShopDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  // Registration Form State
  const [registering, setRegistering] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [gstin, setGstin] = useState("");
  
  // Location States
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Search, Filter, Pagination, and Details Manager states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;

    async function fetchOrders(shopId: string) {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price_at_order,
            products (name, unit)
          ),
          profiles!orders_customer_id_fkey (full_name, phone)
        `)
        .eq("shop_id", shopId)
        .in("status", ["pending", "accepted", "ready", "arrived_at_shop", "picked_up", "delivered", "cancelled", "rejected"])
        .order("created_at", { ascending: false });

      if (data) setOrders(data);
    }

    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/shop/dashboard");
        return;
      }
      setUser(session.user);

      // 1. Get the shop owned by this user
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", session.user.id)
        .single();

      if (!shopData) {
        // User has no shop, we will show the registration form
        setLoading(false);
        return;
      }
      
      const activeShop = shopData as any;
      setShop(activeShop);

      // Fetch low stock items for this shop
      const { data: lowStockData } = await supabase
        .from("shop_inventory")
        .select(`
          id,
          stock_quantity,
          min_stock_alert,
          products (name, unit)
        `)
        .eq("shop_id", activeShop.id);
      
      if (lowStockData) {
        const filtered = (lowStockData as any[]).filter(
          item => item.stock_quantity <= item.min_stock_alert
        );
        setLowStockItems(filtered);
      }

      // 2. Get active orders for this shop (only if approved)
      if (activeShop.is_approved) {
        await fetchOrders(activeShop.id);

        // Subscribe to Realtime once and only once
        channel = supabase
          .channel(`shop_orders_${activeShop.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${activeShop.id}` },
            () => {
              fetchOrders(activeShop.id);
            }
          )
          .subscribe();
      }
      setLoading(false);
    }

    loadDashboard();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router]);

  const detectGPSAndFillAddress = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setCoords({ lat, lon });
        setGpsDetected(true);
        setDetectingGps(false);

        // Fetch address text from Nominatim OSM Reverse Geocoding API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data && data.display_name) {
            setShopAddress(data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
        }
      },
      (error) => {
        console.error("GPS detection failed:", error);
        alert("GPS detection failed. Please enter address manually.");
        setDetectingGps(false);
      }
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  // Case 1: No Shop Registered Yet
  if (!shop) {
    return (
      <div className="max-w-xl mx-auto p-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-brand-light/20 text-brand rounded-2xl flex items-center justify-center mb-4">
              <Store size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Register Your Shop</h2>
            <p className="text-gray-500 text-sm mt-1">Register your retail store to start receiving customer orders.</p>
          </div>

          <form onSubmit={handleRegisterShop} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Shop Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={shopName} 
                  onChange={e => setShopName(e.target.value)} 
                  required 
                  placeholder="e.g. Fresh Grocers & Co."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm bg-white text-gray-900"
                />
                <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop Address</label>
                <button
                  type="button"
                  onClick={detectGPSAndFillAddress}
                  disabled={detectingGps}
                  className="text-xs font-bold text-brand hover:text-brand-dark transition-colors disabled:opacity-50"
                >
                  {detectingGps ? "Detecting GPS..." : gpsDetected ? "✓ GPS Detected" : "⚡ Detect Location"}
                </button>
              </div>
              <div className="relative">
                <textarea 
                  value={shopAddress} 
                  onChange={e => setShopAddress(e.target.value)} 
                  required 
                  placeholder="e.g. Shop 42, Main Market Road, Sector 5"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm min-h-[80px] resize-none bg-white text-gray-900"
                />
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Contact Phone</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={shopPhone} 
                  onChange={e => setShopPhone(e.target.value)} 
                  required 
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm bg-white text-gray-900"
                />
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">GSTIN (Optional)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={gstin} 
                  onChange={e => setGstin(e.target.value)} 
                  placeholder="e.g. 07AAAAA1111A1Z1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm bg-white text-gray-900"
                />
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={registering}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-brand-dark transition-all active:scale-[0.98] disabled:opacity-70 mt-2 flex items-center justify-center"
            >
              {registering ? "Registering Shop..." : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Case 2: Shop Pending Admin Approval
  if (!shop.is_approved) {
    return (
      <div className="max-w-md mx-auto p-4 py-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-6">
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Shop Registration Received</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Thank you for registering <strong>{shop.shop_name}</strong>! Your application is currently under review by our administration team. 
          </p>
          <div className="w-full bg-gray-50 rounded-xl p-4 text-xs text-left border border-gray-100 space-y-2 mb-4">
            <p><span className="font-bold text-gray-500 uppercase tracking-wider mr-2">Shop:</span> {shop.shop_name}</p>
            <p><span className="font-bold text-gray-500 uppercase tracking-wider mr-2">Address:</span> {shop.address}</p>
            <p><span className="font-bold text-gray-500 uppercase tracking-wider mr-2">Status:</span> Pending Review</p>
          </div>
          <p className="text-xs text-gray-400">This usually takes 1-2 business days. We will notify you once approved.</p>
        </div>
      </div>
    );
  }

  // Update order status with dynamic sync for selectedOrder details
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("orders") as any)
      .update({ status: newStatus })
      .eq("id", orderId);
      
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setSelectedOrder((prev: any) => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
    }
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !shopAddress || !shopPhone) return;

    setRegistering(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("shops")
      .insert({
        owner_id: user.id,
        shop_name: shopName,
        address: shopAddress,
        contact_phone: shopPhone,
        gstin: gstin || null,
        location: coords ? `POINT(${coords.lon} ${coords.lat})` : "POINT(77.0266 28.4595)",
        is_approved: false // requires admin approval
      } as any)
      .select()
      .single();

    if (!error && data) {
      setShop(data);
    } else {
      alert(error?.message || "Failed to register shop. Please try again.");
    }
    setRegistering(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  // Case 1: No Shop Registered Yet
  if (!shop) {
    return (
      <div className="max-w-xl mx-auto p-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-brand-light/20 text-brand rounded-2xl flex items-center justify-center mb-4">
              <Store size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Register Your Shop</h2>
            <p className="text-gray-500 text-sm mt-1">Register your retail store to start receiving customer orders.</p>
          </div>

          <form onSubmit={handleRegisterShop} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Shop Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={shopName} 
                  onChange={e => setShopName(e.target.value)} 
                  required 
                  placeholder="e.g. Fresh Grocers & Co."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm bg-white text-gray-900"
                />
                <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shop Address</label>
                <button
                  type="button"
                  onClick={detectGPSAndFillAddress}
                  disabled={detectingGps}
                  className="text-xs font-bold text-brand hover:text-brand-dark transition-colors disabled:opacity-50"
                >
                  {detectingGps ? "Detecting GPS..." : gpsDetected ? "✓ GPS Detected" : "⚡ Detect Location"}
                </button>
              </div>
              <div className="relative">
                <textarea 
                  value={shopAddress} 
                  onChange={e => setShopAddress(e.target.value)} 
                  required 
                  placeholder="e.g. Shop 42, Main Market Road, Sector 5"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm min-h-[80px] resize-none bg-white text-gray-900"
                />
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Contact Phone</label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={shopPhone} 
                  onChange={e => setShopPhone(e.target.value)} 
                  required 
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm bg-white text-gray-900"
                />
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">GSTIN (Optional)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={gstin} 
                  onChange={e => setGstin(e.target.value)} 
                  placeholder="e.g. 07AAAAA1111A1Z1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm bg-white text-gray-900"
                />
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={registering}
              className="w-full bg-brand text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-brand-dark transition-all active:scale-[0.98] disabled:opacity-70 mt-2 flex items-center justify-center"
            >
              {registering ? "Registering Shop..." : "Submit Registration"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Case 2: Shop Pending Admin Approval
  if (!shop.is_approved) {
    return (
      <div className="max-w-md mx-auto p-4 py-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-6">
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Shop Registration Received</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Thank you for registering <strong>{shop.shop_name}</strong>! Your application is currently under review by our administration team. 
          </p>
          <div className="w-full bg-gray-50 rounded-xl p-4 text-xs text-left border border-gray-100 space-y-2 mb-4">
            <p><span className="font-bold text-gray-500 uppercase tracking-wider mr-2">Shop:</span> {shop.shop_name}</p>
            <p><span className="font-bold text-gray-500 uppercase tracking-wider mr-2">Address:</span> {shop.address}</p>
            <p><span className="font-bold text-gray-500 uppercase tracking-wider mr-2">Status:</span> Pending Review</p>
          </div>
          <p className="text-xs text-gray-400">This usually takes 1-2 business days. We will notify you once approved.</p>
        </div>
      </div>
    );
  }

  // Case 3: Shop is Approved - Show Dashboard
  const pendingOrders = orders.filter(o => o.status === "pending");
  const acceptedOrders = orders.filter(o => o.status === "accepted");
  const readyOrders = orders.filter(o => ["ready", "arrived_at_shop", "picked_up"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "delivered");
  const cancelledOrders = orders.filter(o => ["cancelled", "rejected"].includes(o.status));

  // Today's Sales calculation
  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || "0"), 0);

  // Apply search and filter
  const filteredOrders = orders.filter(o => {
    // 1. Search term (Matches customer name or Order ID)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const customerName = (o.profiles?.full_name || "").toLowerCase();
      const orderIdShort = o.id.split("-")[0].toLowerCase();
      if (!customerName.includes(searchLower) && !orderIdShort.includes(searchLower)) return false;
    }

    // 2. Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending" && o.status !== "pending") return false;
      if (statusFilter === "preparing" && o.status !== "accepted") return false;
      if (statusFilter === "out_for_delivery" && !["ready", "arrived_at_shop", "picked_up"].includes(o.status)) return false;
      if (statusFilter === "completed" && o.status !== "delivered") return false;
      if (statusFilter === "cancelled" && !["cancelled", "rejected"].includes(o.status)) return false;
    }

    return true;
  });

  // Pagination logic (10 items per page)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto pb-24">
      {/* Title Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shop Dashboard</h2>
          <p className="text-gray-500 mt-1">{shop.shop_name} • Realtime Orders Management</p>
        </div>
        <button 
          onClick={() => router.push('/shop/inventory')}
          className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-dark transition-colors self-start sm:self-auto shadow-sm text-sm"
        >
          Manage Inventory
        </button>
      </div>

      {/* 🚀 Top KPI Parameters Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <div className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">Today's Revenue</div>
          <div className="text-2xl font-black text-emerald-800 flex items-baseline">
            ₹{totalRevenue.toFixed(2)}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">From {completedOrders.length} delivered orders</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 rounded-2xl p-4 shadow-sm">
          <div className="text-yellow-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>New Requests</span>
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black text-yellow-800">{pendingOrders.length}</div>
          <p className="text-[10px] text-yellow-600 mt-1">Needs action immediately</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
          <div className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">Preparing</div>
          <div className="text-2xl font-black text-blue-800">{acceptedOrders.length}</div>
          <p className="text-[10px] text-blue-600 mt-1">Items in kitchen/packing</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 rounded-2xl p-4 shadow-sm">
          <div className="text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">Ready / Out</div>
          <div className="text-2xl font-black text-purple-800">{readyOrders.length}</div>
          <p className="text-[10px] text-purple-600 mt-1">Awaiting driver pickup</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-1">Total Received</div>
          <div className="text-2xl font-black text-gray-800">{orders.length}</div>
          <p className="text-[10px] text-gray-500 mt-1">Total active & past orders</p>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="stroke-amber-700" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Low Stock Alert!</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item is' : 'items are'} running low on inventory. Update stock soon to avoid missing orders.
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/shop/inventory')}
            className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm shrink-0 text-center"
          >
            Manage Stock
          </button>
        </div>
      )}

      {/* 🔍 Search and Filters Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by ID, customer name..." 
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand text-sm bg-white text-gray-900"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-400 shrink-0 hidden sm:block" />
          <select 
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-1 focus:ring-brand outline-none bg-white text-gray-900 font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">New Requests</option>
            <option value="preparing">Preparing</option>
            <option value="out_for_delivery">Awaiting Driver / Out</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled & Rejected</option>
          </select>
        </div>
      </div>

      {/* 📋 Orders Main Cards / List Section */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <ShoppingBag size={32} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">No Orders Found</h3>
          <p className="text-gray-500 text-sm">No orders match your search or filter options.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOrders.map(order => {
              // Dynamic Status badge coloring
              let statusText = order.status;
              let badgeColor = "bg-gray-100 text-gray-700";
              if (order.status === "pending") {
                statusText = "New Request";
                badgeColor = "bg-yellow-50 text-yellow-700 border border-yellow-200";
              } else if (order.status === "accepted") {
                statusText = "Preparing";
                badgeColor = "bg-blue-50 text-blue-700 border border-blue-200";
              } else if (order.status === "ready") {
                statusText = "Ready to Handover";
                badgeColor = "bg-purple-50 text-purple-700 border border-purple-200";
              } else if (order.status === "arrived_at_shop") {
                statusText = "Driver at Shop";
                badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
              } else if (order.status === "picked_up") {
                statusText = "Out for Delivery";
                badgeColor = "bg-indigo-50 text-indigo-700 border border-indigo-200";
              } else if (order.status === "delivered") {
                statusText = "Delivered";
                badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
              } else if (["cancelled", "rejected"].includes(order.status)) {
                statusText = order.status === "rejected" ? "Rejected" : "Cancelled";
                badgeColor = "bg-red-50 text-red-700 border border-red-200";
              }

              return (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white border border-gray-100 hover:border-brand/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group flex flex-col justify-between min-h-[160px] animate-in fade-in duration-200"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-gray-900 group-hover:text-brand transition-colors text-sm">
                        Order #{order.id.split('-')[0]}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {statusText}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 font-medium">
                      {format(new Date(order.created_at), "MMM d, h:mm a")} • {order.profiles?.full_name || 'Customer'}
                    </p>

                    <div className="mt-3 text-xs text-gray-600 line-clamp-2">
                      {order.order_items.map((item: any) => `${item.quantity}x ${item.products?.name}`).join(", ")}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="font-extrabold text-gray-900 text-sm">₹{order.total_amount}</span>
                    <span className="text-brand text-xs font-bold flex items-center group-hover:translate-x-0.5 transition-transform">
                      Manage <ChevronRight size={14} className="ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🔢 Pagination Control Footer */}
          {totalPages > 1 && (
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between shadow-sm mt-6">
              <span className="text-xs text-gray-500 font-semibold">
                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
                </span>{" "}
                of <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders
              </span>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer text-gray-600"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer text-gray-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🔮 Detailed Order Manager Overlay Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">Order #{selectedOrder.id.split('-')[0]}</h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Placed on {format(new Date(selectedOrder.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
              {/* Customer Details */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Customer Information</h4>
                <p className="text-gray-900 font-semibold">{selectedOrder.profiles?.full_name || 'Customer'}</p>
                {selectedOrder.profiles?.phone && (
                  <p className="text-gray-600 flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-400" /> {selectedOrder.profiles.phone}
                  </p>
                )}
                <p className="text-gray-600 flex items-start gap-1.5 leading-relaxed pt-1">
                  <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" /> 
                  <span>{selectedOrder.delivery_address}</span>
                </p>
              </div>

              {/* Items Summary list */}
              <div className="space-y-3">
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Order Items</h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                  {selectedOrder.order_items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3.5 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900">{item.products?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.products?.unit || "Unit Info"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-gray-900">{item.quantity}x</p>
                        <p className="text-xs text-gray-500 mt-0.5">₹{item.price_at_order}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order total amount */}
              <div className="flex justify-between items-center bg-brand/5 border border-brand/10 rounded-2xl p-4">
                <span className="font-bold text-brand-dark text-base">Grand Total</span>
                <span className="font-black text-brand-dark text-lg">₹{selectedOrder.total_amount}</span>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-gray-100 flex gap-3">
              {selectedOrder.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "rejected");
                      setSelectedOrder(null);
                    }}
                    className="flex-1 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors active:scale-[0.98]"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, "accepted")}
                    className="flex-1 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand-dark transition-colors shadow-sm active:scale-[0.98]"
                  >
                    Accept & Prepare
                  </button>
                </>
              )}

              {selectedOrder.status === "accepted" && (
                <button
                  onClick={() => updateOrderStatus(selectedOrder.id, "ready")}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <PackageOpen size={18} /> Mark as Ready for Pickup
                </button>
              )}

              {selectedOrder.status === "ready" && (
                <div className="w-full bg-purple-50 text-purple-800 text-center py-3 rounded-xl font-bold border border-purple-200 flex items-center justify-center gap-2">
                  <Clock size={16} /> Awaiting Delivery Driver Pickup
                </div>
              )}

              {selectedOrder.status === "arrived_at_shop" && (
                <div className="w-full bg-amber-50 text-amber-800 text-center py-3 rounded-xl font-bold border border-amber-200 flex items-center justify-center gap-2 animate-pulse">
                  <Store size={16} /> Delivery Driver Arrived at Shop! Handover Items.
                </div>
              )}

              {selectedOrder.status === "picked_up" && (
                <div className="w-full bg-indigo-50 text-indigo-800 text-center py-3 rounded-xl font-bold border border-indigo-200 flex items-center justify-center gap-2">
                  <MapPin size={16} /> Order Out for Delivery
                </div>
              )}

              {selectedOrder.status === "delivered" && (
                <div className="w-full bg-emerald-50 text-emerald-800 text-center py-3 rounded-xl font-bold border border-emerald-200 flex items-center justify-center gap-2">
                  <Check size={16} className="stroke-emerald-600" /> Order Successfully Delivered
                </div>
              )}

              {["cancelled", "rejected"].includes(selectedOrder.status) && (
                <div className="w-full bg-red-50 text-red-800 text-center py-3 rounded-xl font-bold border border-red-200 flex items-center justify-center gap-2">
                  <X size={16} /> Order {selectedOrder.status === "rejected" ? "Rejected" : "Cancelled"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
