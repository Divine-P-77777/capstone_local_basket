"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, History, LogOut } from "lucide-react";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Deliveries", href: "/delivery/dashboard", icon: LayoutDashboard },
    { name: "History", href: "/delivery/history", icon: History },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navigation Header for Delivery Partner */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="font-bold text-lg tracking-tight flex items-center">
              LocalBasket <span className="ml-2 px-2.5 py-0.5 bg-brand rounded-full text-xs font-bold uppercase tracking-wider text-white">Delivery</span>
            </h1>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="flex items-center px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} className="mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
        <div className="grid h-full grid-cols-2 mx-auto font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex flex-col items-center justify-center hover:bg-gray-50 transition-colors ${
                  isActive ? "text-brand" : "text-gray-500"
                }`}
              >
                <Icon size={20} className={isActive ? "stroke-brand" : "stroke-gray-500"} />
                <span className="text-[10px] mt-1 font-semibold uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 pb-20 md:pb-4 relative md:my-4 md:rounded-xl">
        {children}
      </main>
    </div>
  );
}
