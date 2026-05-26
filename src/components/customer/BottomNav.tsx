"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, Clock, User } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/home", icon: Home },
    { name: "Cart", href: "/cart", icon: ShoppingCart },
    { name: "Orders", href: "/orders", icon: Clock },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group transition-colors",
                isActive ? "text-brand" : "text-gray-500"
              )}
            >
              <Icon 
                className={cn(
                  "w-6 h-6 mb-1 transition-transform group-active:scale-95",
                  isActive ? "fill-brand/20 stroke-brand" : "stroke-gray-500"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] uppercase tracking-wide font-semibold">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
