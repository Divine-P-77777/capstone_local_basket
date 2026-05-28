"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Store, User as UserIcon, Eye } from "lucide-react";
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
    } else {
      alert("Error approving shop: " + error.message);
    }
  };

  const approveAgent = async (userId: string) => {
    const supabase = createClient();
    const { error } = await (supabase.from("profiles") as any)
      .update({ is_approved: true })
      .eq("id", userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u));
    } else {
      alert("Error approving delivery agent: " + error.message);
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
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2 shadow-sm animate-pulse"></span>
            Pending Shop Approvals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingShops.map(shop => (
              <div key={shop.id} className="bg-white p-6 rounded-2xl border border-yellow-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 group">
                <div className="absolute top-0 right-0 bg-yellow-100/80 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-yellow-200/30">
                  Needs Review
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="text-yellow-600 shrink-0" size={18} />
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand transition-colors line-clamp-1">{shop.shop_name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[40px] leading-relaxed">{shop.address}</p>
                  
                  {shop.contact_phone && (
                    <p className="text-xs text-gray-400 mb-1">
                      <span className="font-semibold text-gray-500">Phone:</span> {shop.contact_phone}
                    </p>
                  )}
                  {shop.gstin && (
                    <p className="text-xs text-gray-400 mb-1">
                      <span className="font-semibold text-gray-500">GSTIN:</span> {shop.gstin}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100/80">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Owner</p>
                      <p className="text-sm font-semibold text-gray-800">{shop.profiles?.full_name || "Unknown Owner"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      href={`/admin/shops/${shop.id}`}
                      className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Eye size={14} className="mr-1.5" /> Review Inventory
                    </Link>
                    <button 
                      onClick={() => approveShop(shop.id)}
                      className="bg-brand hover:bg-brand-dark text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0"
                    >
                      <Check size={14} className="mr-1" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingAgents.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-2 shadow-sm animate-pulse"></span>
            Pending Delivery Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingAgents.map(agent => (
              <div key={agent.id} className="bg-white p-6 rounded-2xl border border-orange-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
                <div className="absolute top-0 right-0 bg-orange-100/80 text-orange-800 text-xs font-bold px-3 py-1 rounded-bl-xl border-l border-b border-orange-200/30">
                  Needs Review
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="text-orange-600 shrink-0" size={18} />
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{agent.full_name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-gray-600">Phone:</span> {agent.phone || "No phone provided"}
                  </p>
                  <p className="text-xs text-gray-400 mb-1">
                    <span className="font-semibold text-gray-500">Address:</span> {agent.address || "No address listed"}
                  </p>
                </div>
                
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-1 rounded-lg border border-orange-100/50 uppercase tracking-wider">
                      Delivery Agent
                    </span>
                    <button 
                      onClick={() => approveAgent(agent.id)}
                      className="bg-brand hover:bg-brand-dark text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Check size={14} className="mr-1" /> Approve
                    </button>
                  </div>
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
