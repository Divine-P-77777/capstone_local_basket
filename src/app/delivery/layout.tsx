export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Simple Header for Delivery Agent */}
      <header className="bg-[#1e293b] text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg tracking-tight flex items-center">
            <span className="text-brand mr-1">⚡</span> LocalBasket Delivery
          </h1>
          <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold">Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto relative md:my-4 md:rounded-xl">
        {children}
      </main>
    </div>
  );
}
