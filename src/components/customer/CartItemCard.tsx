import Image from "next/image";
import { Trash2 } from "lucide-react";
import { CartItem } from "@/store/useCart";

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  return (
    <div className="flex bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-3">
      <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
        <Image
          src={item.image_url || `https://placehold.co/200x200/eee/999?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          fill
          className="object-cover mix-blend-multiply"
        />
      </div>

      <div className="flex-1 ml-3 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
            {item.name}
          </h3>
          <button 
            onClick={() => onRemove(item.product_id)}
            className="text-gray-400 hover:text-red-500 p-1 -mt-1 -mr-1 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        {item.unit && <p className="text-xs text-gray-500 mb-2">{item.unit}</p>}

        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-gray-900">₹{item.price}</span>
          
          <div className="flex items-center bg-gray-100 rounded-lg text-gray-900 font-semibold text-sm overflow-hidden h-[28px]">
            <button
              onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
              className="w-8 h-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              -
            </button>
            <span className="w-6 text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
              className="w-8 h-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
