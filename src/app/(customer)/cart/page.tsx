"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/useCart";
import { CartItemCard } from "@/components/customer/CartItemCard";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, MapPin, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, shopId, getTotal, updateQuantity, removeItem, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const cartTotal = getTotal();
  const deliveryFee = 20; // Fixed delivery fee for now
  const grandTotal = cartTotal > 0 ? cartTotal + deliveryFee : 0;

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        
        // Fetch default address if available
        const { data: profile } = await supabase
          .from("profiles")
          .select("address")
          .eq("id", session.user.id)
          .single();
          
        const typedProfile = profile as any;
        if (typedProfile?.address) {
          setAddress(typedProfile.address);
        }
      }
    }
    getUser();
  }, []);

  const handlePlaceOrder = async () => {
    if (!userId) {
      router.push("/login?redirect=/cart");
      return;
    }
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    if (items.length === 0 || !shopId) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: userId,
          shop_id: shopId,
          total_amount: grandTotal,
          status: "pending",
          delivery_address: address,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItemsToInsert = items.map((item) => ({
        order_id: (order as any).id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_order: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsToInsert as any);

      if (itemsError) throw itemsError;

      // 3. Clear cart and redirect to tracking page
      clearCart();
      router.push(`/orders/${(order as any).id}`);
    } catch (err: any) {
      console.error("Order placement failed:", err);
      setError(err.message || "Failed to place order. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Looks like you haven't added anything to your cart yet.
        </p>
        <button
          onClick={() => router.push("/home")}
          className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-sm"
        >
          Browse Shops
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28 md:pb-8">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 shadow-sm px-4 py-3 flex items-center">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-gray-900 text-lg ml-2">Checkout</h1>
      </div>

      <div className="p-4 flex-1">
        {/* Delivery Address */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center text-gray-900 font-bold mb-3">
            <MapPin size={18} className="mr-2 text-brand" />
            Delivery Address
          </div>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your full delivery address..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none min-h-[80px]"
          />
        </div>

        {/* Cart Items */}
        <div className="mb-4">
          <h2 className="text-gray-900 font-bold mb-3 px-1">Items</h2>
          {items.map((item) => (
            <CartItemCard
              key={item.product_id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* Bill Details */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
          <h2 className="text-gray-900 font-bold mb-4">Bill Details</h2>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Item Total</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-3 pb-3 border-b border-dashed border-gray-200">
            <span>Delivery Fee</span>
            <span>₹{deliveryFee}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>To Pay</span>
            <span>₹{grandTotal}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Floating Checkout Bar */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cash on Delivery</span>
            <span className="font-bold text-xl text-gray-900">₹{grandTotal}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="bg-brand text-white font-bold py-3 px-8 rounded-xl shadow-sm active:scale-95 transition-transform disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
