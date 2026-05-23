"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { ShoppingBag, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login?redirect=/orders");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          total_amount,
          status,
          created_at,
          shops (
            shop_name
          )
        `)
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [router]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Pending Confirmation', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
      case 'accepted': return { text: 'Accepted', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 };
      case 'ready': return { text: 'Ready for Pickup', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: CheckCircle2 };
      case 'picked_up': return { text: 'On the way', color: 'text-purple-600', bg: 'bg-purple-50', icon: Clock };
      case 'delivered': return { text: 'Delivered', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 };
      case 'cancelled': return { text: 'Cancelled', color: 'text-gray-500', bg: 'bg-gray-100', icon: XCircle };
      case 'rejected': return { text: 'Rejected by Shop', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle };
      default: return { text: status, color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock };
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white sticky top-0 z-40 shadow-sm px-4 py-4">
        <h1 className="font-bold text-gray-900 text-xl">My Orders</h1>
      </div>

      <div className="p-4 flex-1">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={32} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 text-sm">
              You haven't placed any orders. Start exploring local shops!
            </p>
            <button
              onClick={() => router.push("/home")}
              className="bg-brand text-white font-bold py-2.5 px-6 rounded-xl shadow-sm"
            >
              Browse Shops
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const statusDisplay = getStatusDisplay(order.status);
              const StatusIcon = statusDisplay.icon;
              
              return (
                <Link 
                  href={`/orders/${order.id}`} 
                  key={order.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform block"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{order.shops?.shop_name}</h3>
                      <p className="text-xs text-gray-500">
                        {format(new Date(order.created_at), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900">₹{order.total_amount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className={`flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusDisplay.bg} ${statusDisplay.color}`}>
                      <StatusIcon size={14} className="mr-1.5" />
                      {statusDisplay.text}
                    </div>
                    <div className="flex items-center text-xs font-bold text-brand">
                      View Details <ChevronRight size={14} className="ml-0.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
