"use client";

import Link from "next/link";
import { Search, ShoppingCart, User, MapPin } from "lucide-react";
import { useCart } from "@/store/useCart";

export function DesktopHeader() {
  const { items } = useCart();
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="hidden md:block sticky top-0 z-50 w-full bg-brand text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Location */}
          <div className="flex items-center gap-8">
            <Link href="/home" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white text-brand flex items-center justify-center font-bold text-xl">
                LB
              </div>
              <span className="font-bold text-xl tracking-tight">LocalBasket</span>
            </Link>

            <div className="hidden lg:flex items-center hover:bg-white/10 p-2 rounded cursor-pointer transition-colors">
              <MapPin size={20} className="mr-2 shrink-0" />
              <div className="flex flex-col text-xs">
                <span className="opacity-80">Delivering to</span>
                <span className="font-bold truncate max-w-[150px]">123 Main St, Pincode</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl px-8">
            <div className="relative">
              <input
                type="text"
                className="w-full bg-white text-gray-900 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Search for groceries, vegetables, and more..."
              />
              <button className="absolute right-0 top-0 h-full px-4 text-brand bg-accent hover:bg-accent-hover rounded-r-lg transition-colors flex items-center justify-center">
                <Search size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-6">
            <Link href="/orders" className="flex flex-col items-center hover:text-accent transition-colors">
              <span className="text-xs opacity-80">Returns</span>
              <span className="font-bold text-sm">& Orders</span>
            </Link>

            <Link href="/cart" className="flex items-center hover:text-accent transition-colors relative">
              <div className="relative">
                <ShoppingCart size={28} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className="font-bold ml-2">Cart</span>
            </Link>

            <Link href="/profile" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded transition-colors">
              <User size={24} />
              <span className="font-bold text-sm">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
