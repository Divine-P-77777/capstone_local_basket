"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { PackageOpen, Check, X, Clock, ShoppingBag, Store, MapPin, Phone, Building } from "lucide-react";

export default function ShopDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Registration Form State
  const [registering, setRegistering] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [gstin, setGstin] = useState("");

  useEffect(() => {
    const supabase = createClient();

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

      // 2. Get active orders for this shop (only if approved)
      if (activeShop.is_approved) {
        fetchOrders(activeShop.id);
      } else {
        setLoading(false);
      }
    }

    async function fetchOrders(shopId: string) {
      const { data, error } = await supabase
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
        .in("status", ["pending", "accepted", "ready"])
        .order("created_at", { ascending: true });

      if (data) setOrders(data);
      setLoading(false);

      // Subscribe to Realtime
      const channel = supabase
        .channel(`shop_orders_${shopId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
          () => {
            fetchOrders(shopId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    loadDashboard();
  }, [router]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    await (supabase.from("orders") as any)
      .update({ status: newStatus })
      .eq("id", orderId);
      
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o).filter(o => ["pending", "accepted", "ready"].includes(o.status)));
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm"
                />
                <Store size={18} className="absolute left-3 top-3.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Shop Address</label>
              <div className="relative">
                <textarea 
                  value={shopAddress} 
                  onChange={e => setShopAddress(e.target.value)} 
                  required 
                  placeholder="e.g. Shop 42, Main Market Road, Sector 5"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm min-h-[80px] resize-none"
                />
                <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm"
                />
                <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-sm"
                />
                <Building size={18} className="absolute left-3 top-3.5 text-gray-400" />
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
  const readyOrders = orders.filter(o => o.status === "ready");

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">{shop.shop_name} • Today's Orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <ShoppingBag size={32} />
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">No Active Orders</h3>
          <p className="text-gray-500 text-sm">You're all caught up. Waiting for new orders to arrive!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Pending (New Requests) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                New Requests
              </h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
            </div>
            
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order}>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'rejected')}
                    className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors text-sm"
                  >
                    <X size={16} className="mr-1" /> Reject
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'accepted')}
                    className="flex-1 bg-brand text-white font-semibold py-2 rounded-lg flex items-center justify-center shadow-sm hover:bg-brand-dark transition-colors text-sm"
                  >
                    <Check size={16} className="mr-1" /> Accept
                  </button>
                </div>
              </OrderCard>
            ))}
          </div>

          {/* Column 2: Accepted (Preparing) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                Preparing
              </h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{acceptedOrders.length}</span>
            </div>
            
            {acceptedOrders.map(order => (
              <OrderCard key={order.id} order={order}>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors text-sm"
                  >
                    <PackageOpen size={16} className="mr-2" /> Mark as Ready
                  </button>
                </div>
              </OrderCard>
            ))}
          </div>

          {/* Column 3: Ready for Pickup */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Ready to Handover
              </h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{readyOrders.length}</span>
            </div>
            
            {readyOrders.map(order => (
              <OrderCard key={order.id} order={order}>
                <div className="mt-4 pt-4 border-t border-gray-100 bg-green-50 -mx-4 -mb-4 px-4 py-3 rounded-b-xl flex items-center justify-center text-green-700 font-medium text-sm">
                  <Clock size={16} className="mr-2" />
                  Waiting for Delivery Agent
                </div>
              </OrderCard>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

function OrderCard({ order, children }: { order: any, children?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900 text-sm">Order #{order.id.split('-')[0]}</h4>
        <span className="font-bold text-gray-900">₹{order.total_amount}</span>
      </div>
      
      <p className="text-xs text-gray-500 mb-3">
        {format(new Date(order.created_at), "h:mm a")} • {order.profiles?.full_name || 'Customer'}
      </p>

      <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
        {order.order_items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center mb-1 last:mb-0">
            <span className="text-gray-700">
              <span className="font-semibold">{item.quantity}x</span> {item.products?.name}
            </span>
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}
