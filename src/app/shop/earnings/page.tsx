"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { IndianRupee, TrendingUp } from "lucide-react";

export default function ShopEarningsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchEarnings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("earnings")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) {
        const earningsData = data as any[];
        setEarnings(earningsData);
        setTotalEarnings(earningsData.reduce((sum, item: any) => sum + Number(item.amount), 0));
      }
      setLoading(false);
    }

    fetchEarnings();
  }, [router]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading earnings...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Earnings & Payouts</h2>
        <p className="text-gray-500">Track your completed orders and revenue.</p>
      </div>

      <div className="bg-brand text-white rounded-2xl p-6 shadow-md mb-8 flex items-center justify-between">
        <div>
          <p className="text-white/80 font-medium mb-1 flex items-center">
            <TrendingUp size={18} className="mr-2" /> Total Revenue
          </p>
          <h3 className="text-4xl font-bold flex items-center">
            ₹{totalEarnings.toFixed(2)}
          </h3>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <IndianRupee size={32} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Transaction History</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {earnings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No earnings recorded yet.</div>
          ) : (
            earnings.map(earning => (
              <div key={earning.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{earning.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(earning.created_at), "MMM d, yyyy • h:mm a")}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-600">+₹{earning.amount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
