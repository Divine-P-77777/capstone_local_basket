"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { PackageOpen, Check, X, Clock, ShoppingBag } from "lucide-react";

export default function ShopDashboard() {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/shop/dashboard");
        return;
      }

      // 1. Get the shop owned by this user
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", session.user.id)
        .single();

      if (!shopData) {
        // User has no shop, maybe they need to register one, or they aren't a shop owner
        setLoading(false);
        return;
      }
      
      setShop(shopData);

      // 2. Get active orders for this shop
      fetchOrders(shopData.id);
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
            // Re-fetch orders on any change
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
    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
      
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o).filter(o => ["pending", "accepted", "ready"].includes(o.status)));
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!shop) return <div className="p-8 text-center text-red-500">No shop found for your account.</div>;

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
