"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Store, Package, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminShopOversightPage() {
  const { shopId } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShopDetails() {
      const supabase = createClient();
      
      // Fetch shop details
      const { data: shopData } = await supabase
        .from("shops")
        .select("*, profiles(full_name, phone, email)")
        .eq("id", shopId as string)
        .single();

      if (shopData) {
        setShop(shopData);
        
        // Fetch inventory
        const { data: invData } = await supabase
          .from("shop_inventory")
          .select("*, products(*)")
          .eq("shop_id", shopId as string)
          .order("updated_at", { ascending: false });
          
        if (invData) setInventory(invData);
      }
      setLoading(false);
    }

    if (shopId) fetchShopDetails();
  }, [shopId]);

  if (loading) return <div className="p-8 text-gray-500">Loading shop details...</div>;
  if (!shop) return <div className="p-8 text-red-500">Shop not found.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/admin/users" className="inline-flex items-center text-sm text-gray-500 hover:text-brand transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to Users & Shops
        </Link>
        <div className="flex items-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mr-4">
            <Store size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shop.shop_name}</h1>
            <p className="text-gray-500">{shop.address}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Owner Details</h3>
          <p className="font-semibold text-gray-900">{shop.profiles?.full_name}</p>
          <p className="text-sm text-gray-500">{shop.profiles?.phone}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Shop Status</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            shop.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {shop.is_approved ? 'Active & Approved' : 'Pending Approval'}
          </span>
          <p className="text-sm text-gray-500 mt-2">Total Orders: <span className="font-bold text-gray-900">{shop.total_orders || 0}</span></p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <Package size={20} className="mr-2 text-brand" />
        Inventory Oversight
      </h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price Set</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Available</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    This shop has not added any products to their inventory yet.
                  </td>
                </tr>
              ) : (
                inventory.map(item => {
                  const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_alert;
                  const isOutOfStock = item.stock_quantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-gray-900">{item.products?.name}</p>
                        <p className="text-xs text-gray-500">{item.products?.category} • {item.products?.unit}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">₹{item.price}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{item.stock_quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                            <AlertCircle size={12} className="mr-1" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
