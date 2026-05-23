"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Search, Star, Info, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/store/useCart";

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const [shop, setShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { items, addItem, removeItem, updateQuantity, getItemQuantity, getTotal } = useCart();
  const cartTotal = getTotal();
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    async function fetchShopData() {
      const supabase = createClient();

      // Fetch shop details
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single();

      if (shopData) {
        setShop(shopData);

        // Fetch inventory joined with products
        const { data: invData } = await supabase
          .from("shop_inventory")
          .select(`
            id,
            price,
            stock_quantity,
            is_available,
            products (
              id, name, category, unit, image_url
            )
          `)
          .eq("shop_id", shopId)
          .eq("is_available", true);

        if (invData) setInventory(invData);
      }
      setLoading(false);
    }

    if (shopId) fetchShopData();
  }, [shopId]);

  if (loading) return <div className="p-8 text-center">Loading shop...</div>;
  if (!shop) return <div className="p-8 text-center text-red-500">Shop not found</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Shop Header */}
      <div className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="flex items-center p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <div className="ml-2 flex-1">
            <h1 className="font-bold text-gray-900 text-lg truncate">{shop.shop_name}</h1>
            <p className="text-xs text-gray-500 flex items-center">
              <span className="flex items-center text-green-600 font-medium mr-2">
                <Star size={12} className="fill-green-600 mr-0.5" /> 4.5
              </span>
              Delivery in 15 mins
            </p>
          </div>
          <button className="p-2 text-gray-700">
            <Search size={22} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 flex items-start">
          <Info size={16} className="text-blue-500 mt-0.5 mr-2 shrink-0" />
          <p className="text-xs text-blue-700">
            Support local kirana stores. Every order helps your neighborhood business grow.
          </p>
        </div>

        {/* Products */}
        <h2 className="font-bold text-gray-900 text-lg mb-4">All Products</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {inventory.map((item) => {
            const product = item.products;
            if (!product) return null;

            const qty = getItemQuantity(product.id);

            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex flex-col relative overflow-hidden">
                <div className="aspect-square relative rounded-lg bg-gray-50 mb-3 overflow-hidden border border-gray-50">
                  <Image
                    src={product.image_url || `https://placehold.co/200x200/eee/999?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    fill
                    className="object-cover mix-blend-multiply"
                  />
                  {/* Fake discount tag */}
                  <div className="absolute top-0 left-0 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                    BEST PRICE
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">{product.unit}</p>
                  <h3 className="font-medium text-sm text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[40px]">
                    {product.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="font-bold text-gray-900">₹{item.price}</span>

                  {qty === 0 ? (
                    <button
                      onClick={() => addItem({
                        product_id: product.id,
                        name: product.name,
                        price: item.price,
                        quantity: 1,
                        shop_id: shopId,
                        image_url: product.image_url,
                        unit: product.unit
                      })}
                      className="border border-brand text-brand hover:bg-brand/5 px-4 py-1 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center bg-brand rounded-lg text-white font-semibold text-sm shadow-sm overflow-hidden h-[30px]">
                      <button
                        onClick={() => updateQuantity(product.id, qty - 1)}
                        className="w-8 h-full flex items-center justify-center hover:bg-brand-dark active:bg-brand-dark transition-colors"
                      >
                        -
                      </button>
                      <span className="w-6 text-center">{qty}</span>
                      <button
                        onClick={() => updateQuantity(product.id, qty + 1)}
                        className="w-8 h-full flex items-center justify-center hover:bg-brand-dark active:bg-brand-dark transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Summary */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-[72px] md:bottom-4 left-0 w-full px-4 z-50">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-brand text-white rounded-xl p-4 flex items-center justify-between shadow-lg active:scale-[0.98] transition-transform"
            >
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm">
                  {cartItemsCount} {cartItemsCount === 1 ? 'item' : 'items'}
                </span>
                <span className="font-bold">₹{cartTotal}</span>
              </div>
              <div className="flex items-center font-bold text-sm">
                View Cart
                <ChevronRight size={18} className="ml-1" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
