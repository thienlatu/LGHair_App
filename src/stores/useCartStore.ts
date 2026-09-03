import { create } from 'zustand';
import { cartApi, CartItemDto, CartDto } from '../services/cartApi';
import apiClient from '../services/apiClient';

interface CartState {
  cart: CartDto | null;
  items: CartItemDto[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addVariant: (maBienThe: string, soLuong: number, maSp: string) => Promise<void>;
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
      const enrichedItems = data.items.map(item => {
        if (item.loai === 'BIENTHE') {
          const { PRODUCTS } = require('./useDataStore').useDataStore.getState();
          const foundProduct = PRODUCTS?.find((p: any) => p.maSp === item.maSp || p.maBienThe === item.id || (p.bienThes && p.bienThes.some((b: any) => b.maBienThe === item.id)));
          if (foundProduct && !item.ten.includes(foundProduct.tenSp)) {
            return { ...item, ten: `${foundProduct.tenSp} - ${item.ten}` };
          }
        }
        return item;
      });
      set({ cart: data, items: enrichedItems, totalItems, totalPrice, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  addVariant: async (maBienThe: string, soLuong: number, maSp: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await cartApi.addVariant(maBienThe, soLuong);
      const totalItems = data.items.length;
      const totalPrice = data.items.reduce((sum, item) => sum + (item.gia * item.soLuong), 0);
      
      const updatedItems = data.items.map(item => {
        let newItem = item;
        if (item.id === maBienThe) {
          newItem = { ...item, maSp: maSp };
        }
        if (newItem.loai === 'BIENTHE') {
          const { PRODUCTS } = require('./useDataStore').useDataStore.getState();
          const foundProduct = PRODUCTS?.find((p: any) => p.maSp === newItem.maSp || p.maBienThe === newItem.id || (p.bienThes && p.bienThes.some((b: any) => b.maBienThe === newItem.id)));
          if (foundProduct && !newItem.ten.includes(foundProduct.tenSp)) {
            newItem.ten = `${foundProduct.tenSp} - ${newItem.ten}`;
          }
        }
        return newItem;
      });

      set({ cart: data, items: updatedItems, totalItems, totalPrice, isLoading: false });
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
      const enrichedItems = data.items.map(item => {
        if (item.loai === 'BIENTHE') {
          const { PRODUCTS } = require('./useDataStore').useDataStore.getState();
          const foundProduct = PRODUCTS?.find((p: any) => p.maSp === item.maSp || p.maBienThe === item.id || (p.bienThes && p.bienThes.some((b: any) => b.maBienThe === item.id)));
          if (foundProduct && !item.ten.includes(foundProduct.tenSp)) {
            return { ...item, ten: `${foundProduct.tenSp} - ${item.ten}` };
          }
        }
        return item;
      });
      set({ cart: data, items: enrichedItems, totalItems, totalPrice, error: null });
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
      const enrichedItems = data.items.map(item => {
        if (item.loai === 'BIENTHE') {
          const { PRODUCTS } = require('./useDataStore').useDataStore.getState();
          const foundProduct = PRODUCTS?.find((p: any) => p.maSp === item.maSp || p.maBienThe === item.id || (p.bienThes && p.bienThes.some((b: any) => b.maBienThe === item.id)));
          if (foundProduct && !item.ten.includes(foundProduct.tenSp)) {
            return { ...item, ten: `${foundProduct.tenSp} - ${item.ten}` };
          }
        }
        return item;
      });
      set({ cart: data, items: enrichedItems, totalItems, totalPrice, error: null });
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
