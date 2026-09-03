import { create } from 'zustand';
import { ProductListItem, Service, Category, ComboItem } from '../types';
import apiClient from '../services/apiClient';

interface DataState {
  PRODUCTS: ProductListItem[];
  SERVICES: Service[];
  COMBOS: ComboItem[];
  CATEGORIES: Category[];
  isLoading: boolean;
  error: string | null;
  currentRequestId: number;
  loadServices: (signal?: AbortSignal) => Promise<void>;
}

let requestCounter = 0;

export const useDataStore = create<DataState>((set, get) => ({
  PRODUCTS: [],
  COMBOS: [],
  SERVICES: [],
  CATEGORIES: [],
  isLoading: false,
  error: null,
  currentRequestId: 0,
  
  loadServices: async (signal?: AbortSignal) => {
    requestCounter++;
    const thisRequestId = requestCounter;

    set({ isLoading: true, error: null, currentRequestId: thisRequestId });
    try {
      // 1. GỌI API KÈM THAM SỐ RÕ RÀNG
      const [serviceRes, productRes, categoryRes] = await Promise.all([
        apiClient.get('/api/DanhSachDichVu', { 
          signal,
          params: {
            servicePage: 1,
            servicePageSize: 100, // Lấy đủ dữ liệu cho 1 phiên
            comboPage: 1,
            comboPageSize: 50
          }
        }),
      apiClient.get('/api/SanPham/filter', { 
          signal,
          params: { pageSize: 100 } // Tạm lấy 100 để đủ fill vào màn hình 
        }),
        apiClient.get('/api/danhmuc', { signal })
      ]);

      if (get().currentRequestId !== thisRequestId) return;

      // 2. MAPPING DỮ LIỆU CHUẨN XÁC
      const rawCategories: any[] = categoryRes.data.$values || categoryRes.data || [];
      const activeCategories: Category[] = rawCategories
        .filter(cat => cat.trangThai === 1)
        .map(cat => ({
          ...cat,
          maDM: cat.maDM,
        }));
            // const activeServices: Service[] = (serviceRes.data.services || []).reverse();
      const activeServices: Service[] = serviceRes.data.services || [];
      const activeCombos: ComboItem[] = serviceRes.data.combos || [];
      const activeProducts: ProductListItem[] = productRes.data.data || [];

      // 3. CẬP NHẬT STATE
      set({
        SERVICES: activeServices,
        COMBOS: activeCombos,
        CATEGORIES: activeCategories,
        PRODUCTS: activeProducts,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      if (get().currentRequestId !== thisRequestId) return;
      if (error.name === 'CanceledError' || error.message === 'canceled') return;

      let errorMessage = error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.';
      if (error.message === 'Network Error' || error.type === 'NETWORK_FAILURE' || error.type === 'OFFLINE_BEFORE_SEND') {
        errorMessage = 'Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
      }
      set({ error: errorMessage, isLoading: false });
    }
  }
}));
