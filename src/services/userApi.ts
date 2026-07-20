import apiClient from './apiClient';

export interface UpdateProfileRequest {
  hoTen: string;
  sdt: string;
  email: string;
  gioiTinh?: string;
}

export const userApi = {
  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await apiClient.put('/api/Profile/update', data);
    return response.data;
  },
  uploadAvatar: async (formData: FormData) => {
    const response = await apiClient.post('/api/Profile/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getBookingHistory: async (maKh: string) => {
    const response = await apiClient.get(`/api/LichSuHoaDon/booking-history/${maKh}`);
    return response.data;
  },
  getProductOrderHistory: async (maKh: string) => {
    const response = await apiClient.get(`/api/DonHangSanPham/lich-su/${maKh}`);
    return response.data;
  },
  getBookingDetail: async (id: string) => {
    const response = await apiClient.get(`/api/LichSuHoaDon/booking-detail/${id}`);
    return response.data;
  }
};
