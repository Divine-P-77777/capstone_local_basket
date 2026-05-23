"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Package, Save, AlertCircle } from "lucide-react";

export default function ShopInventoryPage() {
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // New inventory item form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("10");

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Get shop
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", session.user.id)
        .single();

      if (!shopData) {
        setLoading(false);
        return;
      }
      setShop(shopData);

      // Get inventory
      fetchInventory(shopData.id);

      // Get master catalog
      const { data: catalogData } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (catalogData) setMasterCatalog(catalogData);
    }

    fetchData();
  }, [router]);

  async function fetchInventory(shopId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("shop_inventory")
      .select(`
        *,
        products (*)
      `)
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false });

    if (data) setInventory(data);
    setLoading(false);
  }

  const updateStock = async (invId: string, newQty: number) => {
    if (newQty < 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("shop_inventory")
      .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", invId);

    if (!error) {
      setInventory(prev => prev.map(i => i.id === invId ? { ...i, stock_quantity: newQty } : i));
    }
  };

  const markOutOfStock = async (invId: string) => {
    updateStock(invId, 0);
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !selectedProductId || !price) return;

    // Check if already in inventory
    if (inventory.some(i => i.product_id === selectedProductId)) {
      alert("This product is already in your inventory!");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("shop_inventory")
      .insert({
        shop_id: shop.id,
        product_id: selectedProductId,
        price: parseFloat(price),
        stock_quantity: parseInt(stockQuantity) || 0
      });

    if (!error) {
      setIsAdding(false);
      setSelectedProductId("");
      setPrice("");
      setStockQuantity("10");
      fetchInventory(shop.id);
    } else {
      alert("Error adding product to inventory");
    }
    setLoading(false);
  };

  if (loading && inventory.length === 0) return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;
  if (!shop) return <div className="p-8 text-center text-red-500">No shop found for your account.</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-500">Manage pricing and stock availability.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-brand text-white font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center hover:bg-brand-dark transition-colors"
        >
          {isAdding ? "Cancel" : <><Plus size={18} className="mr-2" /> Add Item</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add from Master Catalog</h2>
          <form onSubmit={handleAddInventory} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Select Product</label>
              <select 
                value={selectedProductId} 
                onChange={e => setSelectedProductId(e.target.value)} 
                required
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none bg-white"
              >
                <option value="">-- Choose Product --</option>
                {masterCatalog.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Your Price (₹)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={price} 
                onChange={e => setPrice(e.target.value)} 
                required 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Initial Stock</label>
              <input 
                type="number" 
                min="0"
                value={stockQuantity} 
                onChange={e => setStockQuantity(e.target.value)} 
                required 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none"
              />
            </div>
            <div className="md:col-span-4 mt-2">
              <button 
                type="submit" 
                disabled={loading || !selectedProductId || !price}
                className="bg-gray-900 text-white font-bold py-2.5 px-8 rounded-lg shadow-sm hover:bg-black transition-colors disabled:opacity-50"
              >
                <Save size={18} className="inline mr-2" /> Save to Inventory
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory.map(item => {
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
                      <div className="flex items-center">
                        <div className="flex items-center bg-gray-100 rounded-lg text-gray-900 font-semibold text-sm overflow-hidden h-[32px]">
                          <button
                            onClick={() => updateStock(item.id, item.stock_quantity - 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-10 text-center bg-white">{item.stock_quantity}</span>
                          <button
                            onClick={() => updateStock(item.id, item.stock_quantity + 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
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
                    <td className="px-6 py-4 text-right">
                      {!isOutOfStock && (
                        <button 
                          onClick={() => markOutOfStock(item.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                        >
                          Mark Out of Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Package size={32} className="mx-auto mb-3 text-gray-300" />
                    Your inventory is empty. Click "Add Item" to start selling.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
