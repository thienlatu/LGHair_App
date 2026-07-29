import apiClient from './apiClient';

export interface BookingServiceItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: number;
  icon: string;
}

export interface Stylist {
  id: string;
  name: string;
  role: string;
  img: string;
  rating: number;
  isAvailable?: boolean;
  unAvailableReason?: string;
  caLam?: string;
  isFavorite?: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  desc: string;
  expiry: string;
}

export interface PaymentRequest {
  Amount: number;
  OrderDescription: string;
}

export interface CheckoutSummaryRequest {
  CheckoutType?: string;
  MaKh?: string;
  CustomerName?: string;
  Phone?: string;
  Email?: string;
  Note?: string;
  BookingDate?: string; // DateTime ISO string
  StylistId?: string;

  Services?: { Id: string; Price: number; Duration: number }[];
  Products?: { Id: string; Gia: number; SoLuong: number }[];
  ReceiveType?: string;
  DeliveryInfo?: { HoTen: string; SoDienThoai: string; DiaChi: string; Email: string };
  VoucherIds?: string[];

  GrandTotal: number;
  PaidAmount: number;
  ShippingFee: number;

  PaymentMode?: string;
  ServicePaymentMethod?: string;
  ProductPaymentMethod?: string;

  InvoiceInfo?: {
    LaDoanhNghiep: boolean;
    TenCongTy?: string;
    Mst?: string;
    DiaChiXuatHD: string;
    EmailNhanHD: string;
  };
}

export interface ProductCheckoutRequest {
  MaKh?: string;
  HoTen?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  Products: { MaBienThe: string; GiaBan: number; SoLuong: number }[];
  ShippingFee: number;
  PaymentMethod?: string;
  VoucherIds?: string[];
  returnUrl?: string;
}

export interface BookingFinalRequest {
  MaKh: string;
  HoTen: string;
  Phone: string;
  Email: string;
  BookingId: string; // Chuỗi > 10 ký tự, vd: "LD" + Date.now() + Math.floor(...)
  Services: { Id: string; Price: number }[];
  MaCodes: string[];
  NgayHen: string; // ISO 8601 DateTime string
  InvoiceInfo?: {
    LaDoanhNghiep: boolean;
    TenCongTy?: string;
    Mst?: string;
    DiaChiXuatHD: string;
    EmailNhanHD: string;
  };
}

export interface BookingFinalResponse {
  message: string;
  maLd: string;
}

export const bookingApi = {
  // Lấy danh sách dịch vụ & combo
  getBookingData: async () => {
    const response = await apiClient.get('/api/DatDichVu/data-booking');
    return response.data;
  },

  // Lấy danh sách thợ cắt
  getStylists: async () => {
    const response = await apiClient.get('/api/DatDichVu/get-stylists');
    return response.data;
  },

  // Tìm thợ rảnh theo ngày giờ
  getAvailableStylists: async (payload: { NgayHen: string; GioBatDau: string; TongThoiGian: number }) => {
    const response = await apiClient.post('/api/DatDichVu/get-available-stylists', payload);
    return response.data;
  },

  // Lấy danh sách voucher của khách hàng
  getMyVouchers: async (maKh: string, params: { subTotal: number; ngayGioHen?: string; itemIds?: string }) => {
    const response = await apiClient.get(`/api/ThanhToanTong/get-my-vouchers/${maKh}`, { params });
    return response.data;
  },

  // Xem trước giá sau khi áp voucher
  previewVoucherStack: async (params: { maKH: string; codes?: string; subTotal: number; ngayGioHen?: string; itemIds?: string }) => {
    const response = await apiClient.get('/api/ThanhToanTong/preview-voucher-stack', { params });
    return response.data;
  },

  // Tạo URL thanh toán (MoMo / VNPay)
  createPayment: async (payload: { Amount: number; OrderDescription: string }) => {
    const response = await apiClient.post('/api/DatDichVu/create-payment', payload);
    return response.data; // { url: string }
  },

  // Lưu đặt lịch (Chỉ mua dịch vụ)
  submitBooking: async (payload: BookingFinalRequest, paymentMode: string, maStylist?: string): Promise<BookingFinalResponse> => {
    const response = await apiClient.post('/api/DatDichVu/save-booking-final', payload, {
      params: { paymentMode, maStylist }
    });
    return response.data;
  },

  // Lưu đặt lịch & thanh toán (Có dịch vụ hoặc Gộp)
  submitCheckout: async (payload: CheckoutSummaryRequest) => {
    const response = await apiClient.post('/api/ThanhToanTong/submit-checkout', payload);
    return response.data;
  },

  // Lưu đặt hàng sản phẩm (Chỉ mua sản phẩm)
  submitProductOrder: async (payload: ProductCheckoutRequest) => {
    const response = await apiClient.post('/api/ThanhToanSanPham/submit-product-order', payload);
    return response.data;
  },

  // =====================================================================
  // CÁC API XÁC NHẬN THANH TOÁN KHI VNPAY/MOMO TRẢ VỀ (DÙNG Ở TRANG KẾT QUẢ)
  // =====================================================================

  // 1. Xác nhận cho luồng "Chỉ mua sản phẩm" (Controller: ThanhToanSanPhamController)
  confirmProductPayment: async (orderId: string, vnp_ResponseCode?: string, resultCode?: string) => {
    const response = await apiClient.get('/api/ThanhToanSanPham/confirm-payment', {
      params: { orderId, vnp_ResponseCode, resultCode }
    });
    return response.data;
  },

  // 2. Lấy biên lai và xác nhận cho luồng "Tổng"
  getReceipt: async (maHd: string, vnp_ResponseCode?: string, resultCode?: string) => {
    const response = await apiClient.get('/api/ThanhToanTong/get-receipt', {
      params: { maHd, vnp_ResponseCode, resultCode }
    });
    return response.data;
  }
};