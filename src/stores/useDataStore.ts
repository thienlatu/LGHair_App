import { create } from 'zustand';
import { ProductListItem, Service, Category } from '../types';
import apiClient from '../services/apiClient';

interface DataState {
  PRODUCTS: ProductListItem[];
  SERVICES: Service[];
  COMBOS: any[];
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
  SERVICES: [
    {
      maDv: 's1', tenDv: "Cắt Tóc Signature", moTa: "Thiết kế riêng theo cấu trúc khuôn mặt và phong cách sống.",
      gia: 120, displayPrice: "$120", thoiGianLam: 60, trangThai: 1, maDm: "DM1",
      hinhAnhs: [{ maHa: 1, duongDan: "https://hairsalon.vn/media/upload/thumb/2025/02/17/cattoc.jpg" }],
      fullDesc: "Gói cắt tóc Signature không chỉ là tỉa tóc; đó là sự tái cấu trúc lại mái tóc của bạn. Chúng tôi bắt đầu với buổi tư vấn chi tiết về hình dáng khuôn mặt, chất tóc. Kỹ thuật cắt được tinh chỉnh riêng biệt, kết thúc bằng phần sấy và tạo kiểu chuyên nghiệp.",
      whatToExpect: ["Tư vấn chi tiết", "Massage da đầu thư giãn", "Cắt tỉa chuẩn xác", "Sấy tạo kiểu Signature"]
    },
    {
      maDv: 's2', tenDv: "Nhuộm Màu Thiết Kế", moTa: "Nhuộm màu đa tầng và phủ bóng thiết kế riêng.",
      gia: 250, displayPrice: "Từ $250", thoiGianLam: 120, trangThai: 1, maDm: "DM1",
      hinhAnhs: [{ maHa: 2, duongDan: "https://hairsalon.vn/media/upload/thumb/2025/02/17/nhuomtoc.png" }],
      fullDesc: "Nâng tầm diện mạo với dịch vụ nhuộm màu thiết kế độc quyền. Sử dụng công thức cao cấp, ít độc hại, chuyên gia pha màu của chúng tôi sẽ tạo ra sắc độ đa tầng tôn lên hoàn hảo làn da của bạn, từ highlight liền mạch đến kỹ thuật nhuộm khối nghệ thuật.",
      whatToExpect: ["Phân tích lịch sử màu", "Pha màu độc quyền", "Phục hồi liên kết tóc", "Khử vàng & Phủ bóng"]
    },
    {
      maDv: 's3', tenDv: "Uốn Kỹ Thuật Số", moTa: "Nếp sóng mềm mại, tự nhiên và bồng bềnh bền lâu.",
      gia: 300, displayPrice: "$300", thoiGianLam: 180, trangThai: 1, maDm: "DM1",
      hinhAnhs: [{ maHa: 3, duongDan: "https://images.unsplash.com/photo-1592856695076-3f2fd7dbfd82?q=80&w=1000" }],
      fullDesc: "Sở hữu nếp tóc sóng nhẹ tựa như thức dậy đã đẹp với công nghệ uốn kỹ thuật số tân tiến. Khác với uốn truyền thống, kỹ thuật này sử dụng thanh cuốn kiểm soát nhiệt để định hình lại cấu trúc tóc, mang đến sóng tóc mềm, lơi và tự nhiên hơn.",
      whatToExpect: ["Kiểm tra độ đàn hồi", "Xử lý trước hóa chất", "Uốn kiểm soát nhiệt", "Định hình nếp"]
    },
    {
      maDv: 's4', tenDv: "Phục Hồi Lụa Silk", moTa: "Phục hồi chuyên sâu mang lại độ bóng mượt như gương.",
      gia: 150, displayPrice: "$150", thoiGianLam: 90, trangThai: 1, maDm: "DM1",
      hinhAnhs: [{ maHa: 4, duongDan: "https://images.unsplash.com/photo-1604263445414-9dd62d2ac089?q=80&w=1000" }],
      fullDesc: "Giải cứu mái tóc hư tổn, làm hóa chất nhiều hay khô xơ tự nhiên với liệu trình Phục hồi Lụa thượng hạng. Liệu trình đa bước này sẽ truyền dưỡng chất keratin cao cấp, protein lụa và axit amin thiết yếu, khóa chặt vào biểu bì tóc.",
      whatToExpect: ["Gội làm sạch sâu", "Truyền dẫn protein", "Khóa biểu bì bằng nhiệt", "Tỉa tóc hoàn thiện"]
    },
  ],
  CATEGORIES: [
    { maDm: 'DM1', tenDanhMuc: 'Dịch vụ chính' },
    { maDm: 'DM2', tenDanhMuc: 'Gội & Phục hồi' },
  ],
  isLoading: false,
  error: null,
  currentRequestId: 0,
  
  loadServices: async (signal?: AbortSignal) => {
    requestCounter++;
    const thisRequestId = requestCounter;

    set({ isLoading: true, error: null, currentRequestId: thisRequestId })
    try {
      const [serviceRes, productRes, categoryRes] = await Promise.all([
        apiClient.get('/api/DanhSachDichVu', { signal }),
        apiClient.get('/api/ThanhToanTong/get-products', { signal }),
        apiClient.get('/api/danhmuc', { signal })
      ]);

      // Stale-response guard
      if (get().currentRequestId !== thisRequestId) {
        console.log(`[Stale Guard] Discarding response for request ${thisRequestId}`);
        return;
      }

      const rawCategories = categoryRes.data.$values || categoryRes.data || [];

      const activeCategories = rawCategories.filter((cat: any) => cat.trangThai === 1).map((cat: any) => ({
        ...cat,
        maDm: cat.maDm ?? cat.maDM ?? cat.maDMSP ?? cat.id,
      }));
      
      const normalizedServices = (serviceRes.data.services || []).map((srv: any) => ({
        ...srv,
        maDv: srv.maDv ?? srv.id,
      }));

      set({
        SERVICES: normalizedServices,
        COMBOS: serviceRes.data.combos,
        CATEGORIES: activeCategories,
        PRODUCTS: productRes.data.data,
        isLoading: false,
        error: null
      })

    } catch (error: any) {
      if (get().currentRequestId !== thisRequestId) return;
      if (error.name === 'CanceledError' || error.message === 'canceled') return;

      let errorMessage = error.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.';
      if (error.message === 'Network Error' || error.type === 'NETWORK_FAILURE' || error.type === 'OFFLINE_BEFORE_SEND') {
        errorMessage = 'Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
      }
      set({ error: errorMessage, isLoading: false })
    }
  }
}));
