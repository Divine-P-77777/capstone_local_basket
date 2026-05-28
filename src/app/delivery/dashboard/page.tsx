"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Package, CheckCircle2, Navigation, IndianRupee, Power, Store as StoreIcon, ExternalLink } from "lucide-react";

export default function DeliveryDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let currentUserId: string | null = null;

    async function fetchOrders(userId: string) {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          shops (
            shop_name,
            address,
            contact_phone,
            owner_id,
            location
          ),
          profiles!orders_customer_id_fkey (full_name, phone)
        `)
        .in('status', ['ready', 'arrived_at_shop', 'picked_up'])
        .order("created_at", { ascending: true });

      if (data) {
        const validOrders = data.filter((o: any) =>
          (o.status === 'ready' && !o.delivery_agent_id) ||
          (o.delivery_agent_id === userId)
        );
        setOrders(validOrders);
      }
      setLoading(false);
    }

    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/delivery/dashboard");
        return;
      }

      currentUserId = session.user.id;
      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
      await fetchOrders(session.user.id);
    }

    loadDashboard();

    const channel = supabase
      .channel(`delivery_orders_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          if (currentUserId) fetchOrders(currentUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const toggleOnlineStatus = async () => {
    if (!profile) return;
    const newStatus = !profile.is_online;
    
    const supabase = createClient();
    const { error } = await (supabase.from("profiles") as any)
      .update({ is_online: newStatus })
      .eq("id", profile.id);
      
    if (!error) {
      setProfile({ ...profile, is_online: newStatus });
    }
  };

  const acceptDelivery = async (orderId: string) => {
    if (!user) return;
    const supabase = createClient();
    
    // Assign agent but keep status 'ready' until they arrive
    const { error } = await (supabase.from("orders") as any)
      .update({ 
        delivery_agent_id: user.id
      })
      .eq("id", orderId)
      .is("delivery_agent_id", null); // Ensure it hasn't been taken
      
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_agent_id: user.id } : o));
    } else {
      alert("Could not accept order. It may have been taken by another agent.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("orders") as any)
      .update({ status: newStatus })
      .eq("id", orderId);
      
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const markDelivered = async (order: any) => {
    const supabase = createClient();
    
    // 1. Mark order as delivered
    const { error: orderError } = await (supabase.from("orders") as any)
      .update({ status: 'delivered' })
      .eq("id", order.id);
      
    if (orderError) {
      alert("Failed to update order status.");
      return;
    }

    const commissionRate = 0.10; // 10% platform fee

    // 2. Insert earnings for the Shop Owner (90% of order)
    const shopOwnerId = order.shops?.owner_id;
    if (shopOwnerId) {
      const shopEarnings = parseFloat(order.total_amount) * (1 - commissionRate);
      await (supabase.from("earnings") as any)
        .insert({
          user_id: shopOwnerId,
          amount: shopEarnings,
          description: `Order #${order.id.split('-')[0]} payout (after 10% platform fee)`
        });
    }

    // 3. Insert earnings for the Delivery Agent (fixed ₹20 delivery fee)
    if (user) {
      await (supabase.from("earnings") as any)
        .insert({
          user_id: user.id,
          amount: 20,
          description: `Delivery fee for Order #${order.id.split('-')[0]}`
        });
    }

    // Optimistic remove from active list
    setOrders(prev => prev.filter(o => o.id !== order.id));
    alert("Delivery completed! ₹20 has been added to your earnings.");
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const isOnline = profile?.is_online || false;
  const availableOrders = orders.filter(o => o.status === "ready" && !o.delivery_agent_id);
  const myDeliveries = orders.filter(o => o.delivery_agent_id === user?.id);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deliveries</h2>
          <p className="text-gray-500">Find new requests or manage your current route.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${isOnline ? 'text-gray-500' : 'bg-gray-100 text-gray-900'}`}>
            Offline
          </span>
          <button
            onClick={toggleOnlineStatus}
            className={`w-12 h-6 rounded-full mx-2 relative transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isOnline ? 'left-7' : 'left-1'}`}></span>
          </button>
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>
            Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Active Deliveries */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
            <Navigation size={18} className="mr-2 text-blue-500" />
            My Active Route
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {myDeliveries.length}
            </span>
          </h3>

          <div className="flex flex-col gap-4">
            {myDeliveries.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 border-dashed rounded-xl p-6 text-center text-gray-500 text-sm">
                You have no active deliveries. Accept an order from the available list!
              </div>
            ) : (
              myDeliveries.map(order => (
                <div key={order.id} className="bg-white border-2 border-blue-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Order #{order.id.split('-')[0]}</h4>
                      <p className="text-xs text-blue-600 font-semibold flex items-center mt-1">
                        <IndianRupee size={12} className="mr-0.5" /> 
                        Collect {order.total_amount} (Cash on Delivery)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 text-sm">
                    {/* From: Shop */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="mt-0.5 mr-2 text-gray-400">
                          <StoreIcon size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pickup From</p>
                          <p className="font-semibold text-gray-900">{order.shops?.shop_name}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{order.shops?.address}</p>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shops?.shop_name + ' ' + order.shops?.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 shrink-0 p-1 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Navigate to shop"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <div className="ml-2 w-0.5 h-4 bg-gray-200"></div>

                    {/* To: Customer */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="mt-0.5 mr-2 text-brand">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Deliver To</p>
                          <p className="font-semibold text-gray-900">{order.profiles?.full_name || 'Customer'}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{order.delivery_address}</p>
                        </div>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-brand shrink-0 p-1 hover:bg-brand/10 rounded-lg transition-colors"
                        title="Navigate to delivery address"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  {order.status === 'ready' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'arrived_at_shop')}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                      <Navigation size={18} className="mr-2" /> Arrived at Shop
                    </button>
                  )}
                  
                  {order.status === 'arrived_at_shop' && (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'picked_up')}
                      className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-orange-600 transition-all active:scale-[0.98]"
                    >
                      <Package size={18} className="mr-2" /> Verify & Order Picked Up
                    </button>
                  )}

                  {order.status === 'picked_up' && (
                    <button 
                      onClick={() => markDelivered(order)}
                      className="w-full bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center shadow-sm hover:bg-green-600 transition-all active:scale-[0.98]"
                    >
                      <CheckCircle2 size={18} className="mr-2" /> Mark as Delivered
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Orders */}
        <div>
          <h3 className="font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
            <Package size={18} className="mr-2 text-orange-500" />
            Available to Pick Up
            <span className="ml-auto bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {isOnline ? availableOrders.length : 0}
            </span>
          </h3>

          {!isOnline ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Power size={32} />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">You are currently Offline</h4>
              <p className="text-gray-500 text-sm">Go online to start receiving delivery requests in your area.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {availableOrders.length === 0 ? (
                <div className="bg-gray-50 border border-gray-100 border-dashed rounded-xl p-6 text-center text-gray-500 text-sm">
                  No orders are currently waiting for pickup.
                </div>
              ) : (
                availableOrders.map(order => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900 text-sm">Order #{order.id.split('-')[0]}</h4>
                      <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded-md">Ready</span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 text-xs mb-4 border border-gray-100">
                      <p className="font-semibold text-gray-900 mb-1 flex items-center">
                        <StoreIcon className="w-3 h-3 mr-1 text-gray-500" /> {order.shops?.shop_name}
                      </p>
                      <p className="text-gray-500 line-clamp-1 mb-2">{order.shops?.address}</p>
                      
                      <p className="font-semibold text-gray-900 mb-1 flex items-center border-t border-gray-200 pt-2">
                        <MapPin className="w-3 h-3 mr-1 text-gray-500" /> Delivery
                      </p>
                      <p className="text-gray-500 line-clamp-1">{order.delivery_address}</p>
                    </div>

                    <button 
                      onClick={() => acceptDelivery(order.id)}
                      className="w-full bg-[#1e293b] text-white font-semibold py-2.5 rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
                    >
                      Accept Delivery
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
