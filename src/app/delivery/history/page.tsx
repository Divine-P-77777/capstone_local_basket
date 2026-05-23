"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Bike, IndianRupee } from "lucide-react";

export default function DeliveryHistoryPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Flat fee per delivery
  const DELIVERY_FEE = 20;

  useEffect(() => {
    const supabase = createClient();

    async function fetchHistory() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total_amount,
          shops (shop_name),
          profiles!orders_customer_id_fkey (full_name)
        `)
        .eq("delivery_agent_id", session.user.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });

      if (data) setDeliveries(data);
      setLoading(false);
    }

    fetchHistory();
  }, [router]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

  const totalEarnings = deliveries.length * DELIVERY_FEE;

  return (
    <div className="p-4 max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Delivery History</h2>
        <p className="text-gray-500">Your completed routes and total earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1e293b] text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-white/70 font-medium mb-1">Total Earnings</p>
            <h3 className="text-3xl font-bold">₹{totalEarnings}</h3>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="bg-brand text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div>
            <p className="text-white/80 font-medium mb-1">Completed Deliveries</p>
            <h3 className="text-3xl font-bold">{deliveries.length}</h3>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Bike size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Completed Routes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {deliveries.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No completed deliveries yet.</div>
          ) : (
            deliveries.map(delivery => (
              <div key={delivery.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="mb-2 md:mb-0">
                  <p className="font-semibold text-sm text-gray-900">
                    Order #{delivery.id.split('-')[0]}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {delivery.shops?.shop_name} → {delivery.profiles?.full_name}
                  </p>
                </div>
                <div className="flex items-center justify-between md:flex-col md:items-end">
                  <span className="font-bold text-green-600">+₹{DELIVERY_FEE}</span>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(delivery.created_at), "MMM d, h:mm a")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
