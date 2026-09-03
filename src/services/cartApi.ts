import apiClient from './apiClient';

export interface CartItemDto {
  id: string;       // mã biến thể, mã dịch vụ, hoặc mã combo
  loai: string;     // 'BIENTHE' | 'DICHVU' | 'COMBO'
  ten: string;
  gia: number;
  hinhAnh?: string;
  soLuong: number;
  soLuongTon?: number; // Backend trả về SoLuongTon
  maSp?: string;       // Frontend tự mapping thêm vào để điều hướng
}

export interface CartDto {
  cartOwner: string;
  items: CartItemDto[];
}

export const cartApi = {
  // Lấy chi tiết giỏ hàng
  getCart: async () => {
    const response = await apiClient.get('/api/GioHang/chi-tiet');
    return response.data as CartDto;
  },

  // Thêm Sản phẩm (biến thể) vào giỏ
  addVariant: async (maBienThe: string, soLuong: number) => {
    const response = await apiClient.post('/api/GioHang/them-bien-the', { MaBienThe: maBienThe, SoLuong: soLuong });
    return response.data as CartDto;
  },

  // Thêm Dịch vụ vào giỏ
  addService: async (maDv: string, soLuong: number) => {
    const response = await apiClient.post('/api/GioHang/them-dich-vu', { MaDv: maDv, SoLuong: soLuong });
    return response.data as CartDto;
  },

  // Thêm Combo vào giỏ
  addCombo: async (maCb: string, soLuong: number) => {
    const response = await apiClient.post('/api/GioHang/them-combo', { MaCb: maCb, SoLuong: soLuong });
    return response.data as CartDto;
  },

  // Cập nhật số lượng
  updateQuantity: async (id: string, loai: string, soLuong: number) => {
    const response = await apiClient.put('/api/GioHang/cap-nhat-so-luong', { Id: id, Loai: loai, SoLuong: soLuong });
    return response.data as CartDto;
  },

  // Xóa 1 item khỏi giỏ
  removeItem: async (id: string, loai: string) => {
    // Axios DELETE with body requires "data" key
    const response = await apiClient.delete('/api/GioHang/xoa-item', {
      data: { Id: id, Loai: loai }
    });
    return response.data as CartDto;
  },

  // Xóa sạch giỏ (có thể lọc theo loại)
  clearCart: async (loai?: string) => {
    const url = loai ? `/api/GioHang/xoa-sach?loai=${loai}` : '/api/GioHang/xoa-sach';
    const response = await apiClient.delete(url);
    return response.data as CartDto;
  },

  // Đồng bộ giỏ sau khi Login (truyền X-Guest-Id)
  syncCartAfterLogin: async (guestId: string) => {
    const response = await apiClient.post('/api/GioHang/dong-bo-khi-login', null, {
      headers: {
        'X-Guest-Id': guestId
      }
    });
    return response.data as CartDto;
  }
};
