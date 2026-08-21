import { create } from 'zustand';
import apiClient, { apiClientCallback } from '../services/apiClient';
import { tokenService } from '../services/tokenService';
import axios from 'axios';
import { useCartStore } from './useCartStore';

// Initialize the callback from apiClient to avoid circular dependencies
apiClientCallback.onSessionExpired = () => {
  useAuthStore.getState().logout();
};

const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT', error);
    return null;
  }
};

const getMaKhFromToken = (token: string) => {
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || decoded.sub || null;
};

interface User {
  maKH: string;
  hoTen: string;
  hinhAnh: string | null;
  maRank: string;
  tenRank: string;
  email: string;
  sdt: string;
  gioiTinh?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, email: string, password: string, otp?: string) => Promise<boolean>;
  googleLogin: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true by default to show loading screen while checking auth
  error: null,

  clearError: () => set({ error: null }),

  updateProfile: (updatedData) => set((state) => ({
    user: state.user ? { ...state.user, ...updatedData } : null
  })),

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/api/Account/login', {
        Username: username,
        Password: password,
      });

      const { data } = response;
      if (data.success && data.user) {
        if (data.user.token) {
          await tokenService.setTokens(data.user.token, data.user.refreshToken || '');
        }

        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.message || 'Đăng nhập thất bại', isLoading: false });
        return false;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        set({
          error: error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.',
          isLoading: false
        });
      } else {
        set({ error: 'Đã xảy ra lỗi không xác định.', isLoading: false });
      }
      return false;
    }
  },

  register: async (name, phone, email, password, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/api/Account/register', {
        HoTen: name,
        Sdt: phone,
        Email: email,
        MatKhau: password,
        OTP: otp
      });

      const { data } = response;
      if (data.success && data.user) {
        if (data.user.token) {
          await tokenService.setTokens(data.user.token, data.user.refreshToken || '');
        }

        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.message || 'Đăng ký thất bại', isLoading: false });
        return false;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        set({
          error: error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.',
          isLoading: false
        });
      } else {
        set({ error: 'Đã xảy ra lỗi không xác định.', isLoading: false });
      }
      return false;
    }
  },

  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/api/Account/google-login', {
        Credential: credential
      });

      const { data } = response;
      if (data.success && data.user) {
        if (data.user.token) {
          await tokenService.setTokens(data.user.token, data.user.refreshToken || '');
        }

        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.message || 'Đăng nhập Google thất bại', isLoading: false });
        return false;
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        set({
          error: error.response?.data?.message || 'Không thể xác thực Google. Vui lòng thử lại.',
          isLoading: false
        });
      } else {
        set({ error: 'Đã xảy ra lỗi không xác định.', isLoading: false });
      }
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.post('/api/Account/logout');
    } catch (e) {
      console.error('Logout API failed', e);
    } finally {
      await tokenService.clearTokens();
      useCartStore.getState().resetCart();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenService.getAccessToken();
      if (!token) throw new Error('No token found');
      const maKH = getMaKhFromToken(token);

      // Backend uses /api/Profile/me for getting profile info
      const response = await apiClient.get('/api/Profile/me');
      if (response.data && response.data.success) {
        set({
          user: { ...response.data.data, maKH: maKH || response.data.data.maKh || response.data.data.maKH },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Not authenticated');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token hết hạn hoặc không hợp lệ
        await tokenService.clearTokens();
        useCartStore.getState().resetCart();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } else {
        // Lỗi mạng hoặc lỗi server khác (500), không tự động logout
        set({ isLoading: false });
      }
    }
  },
}));
