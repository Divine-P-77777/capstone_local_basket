"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Search, XCircle, FileText } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        total_amount,
        created_at,
        shops ( shop_name ),
        customer:profiles!orders_customer_id_fkey ( full_name, phone ),
        agent:profiles!orders_delivery_agent_id_fkey ( full_name )
      `)
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to force-cancel this order? This cannot be undone.")) return;

    const supabase = createClient();
    const { error } = await (supabase.from("orders") as any)
      .update({ status: 'cancelled' })
      .eq("id", orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } else {
      alert("Failed to cancel order.");
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.shops?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-gray-500">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Order Management</h1>
          <p className="text-gray-500">View and manage all platform orders.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search by ID, Shop, or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText size={32} className="mx-auto mb-3 text-gray-300" />
                    No orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-gray-900">#{order.id.split('-')[0]}</p>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(order.created_at), "MMM d, yyyy • h:mm a")}</p>
                      <p className="font-semibold text-gray-900 mt-1">₹{order.total_amount}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">{order.shops?.shop_name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{order.customer?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {order.agent?.full_name || <span className="text-gray-400 italic">Unassigned</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                          order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          order.status === 'ready' || order.status === 'picked_up' || order.status === 'arrived_at_shop' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'rejected' && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="flex items-center justify-end w-full text-red-600 hover:text-red-800 transition-colors text-xs font-bold"
                        >
                          <XCircle size={14} className="mr-1" /> Force Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
