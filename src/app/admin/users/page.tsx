"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Store, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function AdminUsersPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();

    // Fetch shops
    const { data: shopsData } = await supabase
      .from("shops")
      .select("*, profiles(full_name, phone)")
      .order("created_at", { ascending: false });

    if (shopsData) setShops(shopsData);

    // Fetch profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesData) setUsers(profilesData);
    
    setLoading(false);
  }

  const approveShop = async (shopId: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("shops") as any)
      .update({ is_approved: true })
      .eq("id", shopId);

    if (!error) {
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, is_approved: true } : s));
    }
  };

  const approveAgent = async (userId: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("profiles") as any)
      .update({ is_approved: true })
      .eq("id", userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u));
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading data...</div>;

  const pendingShops = shops.filter(s => !s.is_approved);
  const activeShops = shops.filter(s => s.is_approved);
  const pendingAgents = users.filter(u => u.role === 'delivery_agent' && u.is_approved === false);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users & Shops</h1>
        <p className="text-gray-500">Manage platform participants and approve new businesses.</p>
      </div>

      {pendingShops.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
            Pending Shop Approvals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingShops.map(shop => (
              <div key={shop.id} className="bg-white p-5 rounded-xl border-2 border-yellow-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Needs Review
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{shop.shop_name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{shop.address}</p>
                
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-semibold">Owner</p>
                    <p className="text-sm font-medium text-gray-900">{shop.profiles?.full_name}</p>
                  </div>
                  <button 
                    onClick={() => approveShop(shop.id)}
                    className="bg-brand text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-dark transition-colors"
                  >
                    <Check size={16} className="mr-1" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingAgents.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
            Pending Delivery Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingAgents.map(agent => (
              <div key={agent.id} className="bg-white p-5 rounded-xl border-2 border-orange-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Needs Review
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{agent.full_name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px]">{agent.phone}</p>
                
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-semibold">
                    Delivery Agent
                  </div>
                  <button 
                    onClick={() => approveAgent(agent.id)}
                    className="bg-brand text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-dark transition-colors"
                  >
                    <Check size={16} className="mr-1" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* All Shops */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center">
              <Store size={18} className="mr-2 text-purple-600" />
              Active Shops
            </h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{activeShops.length}</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {activeShops.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No active shops yet.</div>
            ) : (
              activeShops.map(shop => (
                <Link key={shop.id} href={`/admin/shops/${shop.id}`} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors block">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-brand transition-colors">{shop.shop_name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{shop.profiles?.full_name} • {shop.profiles?.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-900">Orders</p>
                    <p className="text-lg font-bold text-brand">{shop.total_orders || 0}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* All Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="font-bold text-gray-900 flex items-center">
              <UserIcon size={18} className="mr-2 text-blue-600" />
              All Registered Users
            </h2>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{users.length}</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No users found.</div>
            ) : (
              users.map(user => (
                <div key={user.id} className="p-4 flex items-center hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mr-4 shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-gray-900">{user.full_name || 'Unnamed User'}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
                  </div>
                  <div className="capitalize text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    {user.role?.replace('_', ' ')}
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
