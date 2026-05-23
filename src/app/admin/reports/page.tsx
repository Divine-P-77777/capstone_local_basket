"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays } from "date-fns";
import { BarChart3, TrendingUp, Package } from "lucide-react";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [dailyOrders, setDailyOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    async function fetchAnalytics() {
      const supabase = createClient();
      
      // 1. Fetch Orders for the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, status")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });

      if (orders) {
        // Calculate daily orders
        const dailyMap: Record<string, { count: number, revenue: number }> = {};
        let rev = 0;
        
        orders.forEach(order => {
          if (order.status !== 'cancelled' && order.status !== 'rejected') {
            rev += Number(order.total_amount);
          }
          
          const date = format(new Date(order.created_at), "MMM dd");
          if (!dailyMap[date]) dailyMap[date] = { count: 0, revenue: 0 };
          
          dailyMap[date].count += 1;
          if (order.status !== 'cancelled' && order.status !== 'rejected') {
            dailyMap[date].revenue += Number(order.total_amount);
          }
        });

        const dailyArray = Object.keys(dailyMap).map(date => ({
          date,
          count: dailyMap[date].count,
          revenue: dailyMap[date].revenue
        }));

        setDailyOrders(dailyArray);
        setTotalRevenue(rev);
      }

      // 2. Fetch Order Items for Top Products
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, products(name, category)");

      if (orderItems) {
        const productMap: Record<string, { name: string, category: string, quantity: number }> = {};
        
        orderItems.forEach(item => {
          const p = item.products as any;
          if (!p) return;
          
          const name = p.name;
          if (!productMap[name]) {
            productMap[name] = { name, category: p.category, quantity: 0 };
          }
          productMap[name].quantity += item.quantity;
        });

        const topArray = Object.values(productMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10); // Top 10

        setTopProducts(topArray);
      }

      setLoading(false);
    }

    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Generating reports...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 size={24} className="mr-2 text-brand" /> Reporting & Analytics
        </h1>
        <p className="text-gray-500">Platform performance over the last 30 days.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center col-span-1">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">30-Day Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Orders List (Pseudo-Chart) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Daily Orders (Last 30 Days)</h3>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[400px]">
            {dailyOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No order data available.</p>
            ) : (
              <div className="space-y-4">
                {dailyOrders.slice().reverse().map((day, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-16 text-xs text-gray-500 font-medium">{day.date}</div>
                    <div className="flex-1 mx-4 h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand" 
                        style={{ width: `${Math.min((day.count / 20) * 100, 100)}%` }} // Arbitrary scaling for visual
                      ></div>
                    </div>
                    <div className="w-12 text-right text-sm font-bold text-gray-900">{day.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Most Selling Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Most Selling Products</h3>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[400px]">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No product data available.</div>
            ) : (
              topProducts.map((product, idx) => (
                <div key={idx} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                  <div className="w-8 text-center font-bold text-gray-400 mr-2">#{idx + 1}</div>
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center mr-4">
                    <Package size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Units Sold</p>
                    <p className="font-bold text-gray-900">{product.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
