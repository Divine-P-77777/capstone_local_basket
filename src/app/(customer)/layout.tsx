import { BottomNav } from "@/components/customer/BottomNav";
import { DesktopHeader } from "@/components/customer/DesktopHeader";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 md:pb-0">
      <DesktopHeader />
      {/* 
        On mobile: max-w-lg, centered.
        On desktop: expands to max-w-7xl to look like a full marketplace.
      */}
      <main className="flex-1 w-full max-w-lg md:max-w-7xl mx-auto bg-white min-h-screen relative shadow-sm border-x border-gray-100 md:my-4 md:rounded-xl md:min-h-[calc(100vh-6rem)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
