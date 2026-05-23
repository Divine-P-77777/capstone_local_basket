import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  shop_id: string;
  image_url?: string;
  unit?: string;
}

interface CartState {
  items: CartItem[];
  shopId: string | null; // Cart can only have items from ONE shop at a time
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemQuantity: (product_id: string) => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopId: null,

      addItem: (item) => {
        set((state) => {
          // If trying to add from a different shop, clear cart first or reject
          // For now, we clear the cart if shop changes
          let currentItems = [...state.items];
          let currentShopId = state.shopId;

          if (currentShopId && currentShopId !== item.shop_id) {
            currentItems = []; // reset
          }
          
          currentShopId = item.shop_id;

          const existingItemIndex = currentItems.findIndex(i => i.product_id === item.product_id);
          
          if (existingItemIndex >= 0) {
            currentItems[existingItemIndex].quantity += item.quantity;
          } else {
            currentItems.push(item);
          }

          return { items: currentItems, shopId: currentShopId };
        });
      },

      removeItem: (product_id) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.product_id !== product_id);
          return {
            items: newItems,
            shopId: newItems.length === 0 ? null : state.shopId
          };
        });
      },

      updateQuantity: (product_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(product_id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => 
            i.product_id === product_id ? { ...i, quantity } : i
          )
        }));
      },

      clearCart: () => set({ items: [], shopId: null }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getItemQuantity: (product_id) => {
        const item = get().items.find(i => i.product_id === product_id);
        return item ? item.quantity : 0;
      }
    }),
    {
      name: 'localbasket-cart',
    }
  )
);
