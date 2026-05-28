"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, CheckCircle2, MapPin, Package, XCircle, Store, X } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function fetchOrder() {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          shops (
            shop_name,
            address,
            phone
          ),
          order_items (
            quantity,
            price_at_order,
            products (
              name,
              unit,
              image_url
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (data) {
        setOrder(data);
      }
      setLoading(false);
    }

    fetchOrder();

    // Subscribe to realtime updates for this order
    const channel = supabase
      .channel(`order_tracking_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          setOrder((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    setCancelling(true);
    const supabase = createClient();
    
    const { error } = await (supabase.from("orders") as any)
      .update({ status: 'cancelled' })
      .eq("id", orderId);
      
    if (!error) {
      setOrder({ ...order, status: 'cancelled' });
    } else {
      alert("Failed to cancel order. It may have already been accepted.");
    }
    setCancelling(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';
  
  const steps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'accepted', label: 'Shop Accepted' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'arrived_at_shop', label: 'Agent Arrived at Shop' },
    { key: 'picked_up', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : (order.status === 'delivered' ? steps.length - 1 : 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-700">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-gray-900 text-lg ml-2">Track Order</h1>
        </div>
        {order.status === 'pending' && (
          <button 
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="text-red-500 font-semibold text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors flex items-center disabled:opacity-50"
          >
            <X size={16} className="mr-1" /> Cancel
          </button>
        )}
      </div>

      <div className="p-4 flex-1">
        {/* Tracking Status Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="font-bold text-gray-900 text-lg mb-1">
            {isCancelled ? 'Order Cancelled' : 'Delivery Status'}
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Order #{order.id.split('-')[0]} • {format(new Date(order.created_at), "MMM d, h:mm a")}
          </p>

          {isCancelled ? (
            <div className="flex items-center justify-center p-6 bg-red-50 text-red-600 rounded-xl mb-2">
              <XCircle size={32} className="mr-3" />
              <div>
                <p className="font-bold">This order was {order.status}.</p>
                <p className="text-sm opacity-80">You will not be charged.</p>
              </div>
            </div>
          ) : (
            <div className="relative pl-4 mt-2">
              {/* Progress Line */}
              <div className="absolute top-2 bottom-2 left-[19px] w-[2px] bg-gray-100 z-0"></div>
              <div 
                className="absolute top-2 left-[19px] w-[2px] bg-brand z-0 transition-all duration-500"
                style={{ height: `${(activeStep / (steps.length - 1)) * 100}%` }}
              ></div>

              {/* Steps */}
              {steps.map((step, index) => {
                const isCompleted = index <= activeStep;
                const isCurrent = index === activeStep;
                
                return (
                  <div key={step.key} className="flex items-start mb-6 relative z-10 last:mb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-300 ${isCompleted ? 'border-brand text-brand' : 'border-gray-200 text-gray-300'}`}>
                      {isCompleted ? <CheckCircle2 size={18} className="fill-brand text-white" /> : <div className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-brand animate-pulse' : 'bg-gray-200'}`}></div>}
                    </div>
                    <div className="ml-4 pt-1">
                      <p className={`text-sm font-bold ${isCurrent ? 'text-brand' : (isCompleted ? 'text-gray-900' : 'text-gray-400')}`}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {index === 0 && "Waiting for shop to confirm"}
                          {index === 1 && "Shop is preparing your items"}
                          {index === 2 && "Waiting for delivery partner"}
                          {index === 3 && "Agent is collecting your order"}
                          {index === 4 && "Partner is on the way to you"}
                          {index === 5 && "Enjoy your order!"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex items-center">
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mr-3">
            <Store size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">{order.shops?.shop_name}</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{order.shops?.address}</p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex items-start">
          <div className="mt-0.5 mr-3 text-brand">
            <MapPin size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Delivery Address</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{order.delivery_address}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center text-gray-900 font-bold text-sm">
            <Package size={16} className="mr-2" />
            Order Summary
          </div>
          <div className="p-4">
            {order.order_items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center mb-3 last:mb-0">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-bold text-gray-600 mr-3">
                    {item.quantity}x
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{item.products?.name}</p>
                    <p className="text-[10px] text-gray-500">{item.products?.unit}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{item.price_at_order * item.quantity}
                </span>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-center text-sm mb-2 text-gray-600">
                <span>Item Total</span>
                <span>₹{order.total_amount - 20}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2 text-gray-600">
                <span>Delivery Fee</span>
                <span>₹20</span>
              </div>
              <div className="flex justify-between items-center font-bold text-gray-900 mt-2">
                <span>Grand Total</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
