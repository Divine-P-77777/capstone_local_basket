export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Simple Header for Shop Owner */}
      <header className="bg-brand text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg tracking-tight">LocalBasket Shop Partner</h1>
          <div className="text-sm font-semibold opacity-90 px-3 py-1 bg-white/20 rounded-full">
            Shop Owner
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto relative md:my-4 md:rounded-xl">
        {children}
      </main>
    </div>
  );
}
