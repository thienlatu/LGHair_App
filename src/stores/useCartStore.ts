import { create } from 'zustand';
import { cartApi, CartItemDto, CartDto } from '../services/cartApi';

interface CartState {
  cart: CartDto | null;
  items: CartItemDto[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addVariant: (maBienThe: string, soLuong: number) => Promise<void>;
  updateQuantity: (id: string, loai: string, soLuong: number) => Promise<void>;
  removeItem: (id: string, loai: string) => Promise<void>;
  clearCart: (loai?: string) => Promise<void>;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,

  resetCart: () => set({
    cart: null,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    isLoading: false,
    error: null,
  }),

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.getCart();
      const totalItems = data.items.length;
      const totalPrice = data.items.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
      set({ cart: data, items: data.items, totalItems, totalPrice, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  addVariant: async (maBienThe: string, soLuong: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.addVariant(maBienThe, soLuong);
      const totalItems = data.items.length;
      const totalPrice = data.items.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
      set({ cart: data, items: data.items, totalItems, totalPrice, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (id: string, loai: string, soLuong: number) => {
    const previousState = get();
    // Optimistic Update
    const optimisticItems = previousState.items.map(item => 
      (item.id === id && item.loai === loai) ? { ...item, soLuong } : item
    );
    const optimisticTotalItems = optimisticItems.length;
    const optimisticTotalPrice = optimisticItems.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
    
    set({ items: optimisticItems, totalItems: optimisticTotalItems, totalPrice: optimisticTotalPrice });

    try {
      const data = await cartApi.updateQuantity(id, loai, soLuong);
      const totalItems = data.items.length;
      const totalPrice = data.items.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
      set({ cart: data, items: data.items, totalItems, totalPrice, error: null });
    } catch (err: any) {
      set({ ...previousState, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  removeItem: async (id: string, loai: string) => {
    const previousState = get();
    // Optimistic Update
    const optimisticItems = previousState.items.filter(item => !(item.id === id && item.loai === loai));
    const optimisticTotalItems = optimisticItems.length;
    const optimisticTotalPrice = optimisticItems.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
    
    set({ items: optimisticItems, totalItems: optimisticTotalItems, totalPrice: optimisticTotalPrice });

    try {
      const data = await cartApi.removeItem(id, loai);
      const totalItems = data.items.length;
      const totalPrice = data.items.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
      set({ cart: data, items: data.items, totalItems, totalPrice, error: null });
    } catch (err: any) {
      set({ ...previousState, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  clearCart: async (loai?: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.clearCart(loai);
      const totalItems = data.items.length;
      const totalPrice = data.items.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
      set({ cart: data, items: data.items, totalItems, totalPrice, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  }
}));
