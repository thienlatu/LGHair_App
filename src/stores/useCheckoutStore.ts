import { create } from 'zustand';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: number;
}

interface CheckoutState {
  cartItems: CartItem[];
  selectedServices: ServiceItem[];
  deliveryMode: 'delivery' | 'pickup';
  bookingDate: string; // ISO string or specific format
  bookingTime: string;
  stylistId: string;
  selectedServiceIds: string[];

  // Actions
  setCartItems: (items: CartItem[] | ((prev: CartItem[]) => CartItem[])) => void;
  setSelectedServices: (services: ServiceItem[] | ((prev: ServiceItem[]) => ServiceItem[])) => void;
  setSelectedServiceIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setDeliveryMode: (mode: 'delivery' | 'pickup') => void;
  setBookingData: (date: string, time: string, stylistId?: string) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  cartItems: [],
  selectedServices: [],
  deliveryMode: 'pickup',
  bookingDate: '',
  bookingTime: '',
  stylistId: '',
  selectedServiceIds: [],

  setCartItems: (items) => set((state) => ({
    cartItems: typeof items === 'function' ? items(state.cartItems) : items
  })),
  setSelectedServices: (services) => set((state) => {
    const newServices = typeof services === 'function' ? services(state.selectedServices) : services;
    return { selectedServices: newServices };
  }),
  setSelectedServiceIds: (ids) => set((state) => {
    const newIds = typeof ids === 'function' ? ids(state.selectedServiceIds) : ids;
    return { selectedServiceIds: newIds };
  }),
  setDeliveryMode: (mode) => set({ deliveryMode: mode }),
  setBookingData: (date, time, stylistId) => set({ bookingDate: date, bookingTime: time, stylistId: stylistId || '' }),
  clearCheckout: () => set({
    cartItems: [],
    selectedServices: [],
    deliveryMode: 'pickup',
    bookingDate: '',
    bookingTime: '',
    stylistId: ''
  })
}));
