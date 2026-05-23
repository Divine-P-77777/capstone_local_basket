"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, ChevronRight, Clock, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Placeholder data for categories
const CATEGORIES = [
  { id: "1", name: "Groceries", image: "https://placehold.co/100x100/1B5E3B/white?text=Gr" },
  { id: "2", name: "Vegetables", image: "https://placehold.co/100x100/F5A623/white?text=Veg" },
  { id: "3", name: "Dairy", image: "https://placehold.co/100x100/e0f2fe/1e3a8a?text=Dairy" },
  { id: "4", name: "Snacks", image: "https://placehold.co/100x100/fef08a/854d0e?text=Snack" },
  { id: "5", name: "Cleaning", image: "https://placehold.co/100x100/fecdd3/9f1239?text=Clean" },
  { id: "6", name: "Beverages", image: "https://placehold.co/100x100/ffedd5/c2410c?text=Drinks" },
  { id: "7", name: "Personal Care", image: "https://placehold.co/100x100/fce7f3/be185d?text=Care" },
  { id: "8", name: "Baby Care", image: "https://placehold.co/100x100/e0e7ff/4338ca?text=Baby" },
];

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchShops() {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("is_approved", true)
        .limit(10);
        
      if (data) setShops(data);
      setLoading(false);
    }
    fetchShops();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile Header section with location and search */}
      <div className="md:hidden sticky top-0 z-40 bg-brand text-white rounded-b-3xl shadow-md pb-6 pt-4 px-4 transition-all">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center text-sm font-bold opacity-90">
              <span className="mr-1">Delivery in</span>
              <Clock size={14} className="mr-1" /> 
              <span>15 mins</span>
            </div>
            <div className="flex items-center text-lg font-bold mt-0.5">
              <MapPin size={18} className="mr-1 shrink-0" />
              <span className="truncate max-w-[200px]">Home - 123 Main St, Pincode</span>
              <ChevronRight size={18} />
            </div>
          </div>
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
              DP
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm shadow-sm"
            placeholder="Search for 'Milk', 'Bread'..."
          />
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1">
        {/* Categories (Horizontal Scroll on Mobile, Grid on Desktop) */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Shop by Category</h2>
          <div className="flex overflow-x-auto md:grid md:grid-cols-6 lg:grid-cols-8 gap-4 pb-2 hide-scrollbar">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex flex-col items-center gap-2 min-w-[80px] md:min-w-0 cursor-pointer group">
                <div className="w-20 h-20 md:w-full md:aspect-square rounded-2xl overflow-hidden bg-gray-50 shadow-sm group-hover:shadow-md group-active:scale-95 transition-all border border-gray-100">
                  <Image src={cat.image} alt={cat.name} width={100} height={100} className="object-cover w-full h-full" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-gray-700 text-center group-hover:text-brand transition-colors">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Shops */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Nearby Kirana Stores</h2>
            <span className="text-sm font-semibold text-brand cursor-pointer hover:underline">See all</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse flex p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="rounded-xl bg-gray-200 h-24 w-24"></div>
                  <div className="ml-4 flex-1 py-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : shops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {shops.map((shop) => (
                <Link key={shop.id} href={`/shop/${shop.id}`}>
                  <div className="flex p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md md:hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer h-full group">
                    <div className="rounded-xl bg-brand-light/10 h-24 w-24 flex items-center justify-center shrink-0 group-hover:bg-brand transition-colors">
                      <span className="text-3xl font-bold text-brand group-hover:text-white transition-colors">{shop.shop_name.charAt(0)}</span>
                    </div>
                    <div className="ml-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-brand transition-colors">{shop.shop_name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{shop.address}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded flex-shrink-0">
                          <Star size={12} className="fill-green-700 mr-1" />
                          {shop.rating || "4.5"}
                        </div>
                        <div className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded flex-shrink-0 border border-gray-100">
                          ~1.2 km
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No shops found</h3>
              <p className="text-gray-500 max-w-sm mx-auto">We couldn't find any approved Kirana stores near your location right now. Please check back later!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
