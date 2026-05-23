"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Store, Users, IndianRupee } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeShops: 0,
    activeAgents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      // 1. Total Orders & Revenue
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, status");

      let totalOrders = 0;
      let totalRevenue = 0;
      
      if (orders) {
        totalOrders = orders.length;
        totalRevenue = orders
          .filter((o: any) => o.status === 'delivered')
          .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
      }

      // 2. Active Shops
      const { count: activeShops } = await supabase
        .from("shops")
        .select("*", { count: 'exact', head: true })
        .eq("is_approved", true);

      // 3. Active Delivery Agents
      const { count: activeAgents } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true })
        .eq("role", "delivery_agent");

      setStats({
        totalOrders,
        totalRevenue,
        activeShops: activeShops || 0,
        activeAgents: activeAgents || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading metrics...</div>;

  const statCards = [
    { title: "Total Revenue", value: `₹${stats.totalRevenue.toFixed(2)}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Active Shops", value: stats.activeShops, icon: Store, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Delivery Agents", value: stats.activeAgents, icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Platform Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center">
              <div className={`w-14 h-14 rounded-full ${card.bg} ${card.color} flex items-center justify-center mr-4`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
          <LayoutDashboardIcon className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Admin Portal</h2>
        <p className="text-gray-500 max-w-md">
          Use the sidebar to navigate to User Management to approve new shops and agents, or to the Master Catalog to manage platform products.
        </p>
      </div>
    </div>
  );
}

function LayoutDashboardIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
  );
}
