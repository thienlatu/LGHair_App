export interface serviceImage {
  maHa: number;
  duongDan: string;
}

export interface PagedResponse<T> {
  success: boolean;
  services?: T[];
  combos?: ComboItem[];
  data?: T[];
  $values?: T[]; 
}
export interface Category {
  maDM: string;
  tenDanhMuc: string;
  hinhAnh?: string | null; 
  ngayTao?: string;
  trangThai?: number;
  soDichVu?: number;
}

export interface DanhMuc {
  maDMSP: string;
  tenDanhMuc: string;
}

export interface ThuongHieu {
  maTh: string;
  tenThuongHieu: string;
  hinhAnh?: string;
}

export interface ProductListItem {
  maSp: string;
  maBienThe?: string; // Tích hợp variant
  tenSp: string;
  tenBienThe?: string; // Tích hợp variant
  moTa: string;
  hinhAnhDaiDien: string;
  giaTu?: number;
  giaDen?: number;
  giaBan?: number; // Tích hợp variant
  soLuongTon: number;
  soBienThe: number;
  soSao?: number;
  soLuongDanhGia: number;
  danhMuc?: DanhMuc;
  thuongHieu?: ThuongHieu;
}

export interface BienTheSanPham {
  maBienThe: string;
  tenBienThe: string;
  giaBan: number;
  soLuongTon: number;
  hinhAnhDaiDien: string;
  phanTramHoaHong?: number;
}

export interface ProductDetail {
  maSp: string;
  tenSp: string;
  moTa: string;
  thanhPhan?: string;
  huongDanSuDung?: string;
  hinhAnhDaiDien: string;
  danhMuc?: DanhMuc;
  thuongHieu?: ThuongHieu;
  hinhAnhs: { maHa: number; duongDan: string }[];
  bienThes: BienTheSanPham[];
  giaTu?: number;
  giaDen?: number;
  soSao?: number;
  soLuongDanhGia: number;
  suggestedProducts: ProductListItem[];
}

export interface Service {
  maDv: string;
  tenDv: string;
  gia: number;
  moTa: string;
  thoiGianLam: number;
  trangThai: number;
  maDm: string;
  hinhAnhs?: serviceImage[];
  hinhAnh?: string;
  // Các trường UI tự thêm (không có sẵn từ BE, có thể để optional)
  displayPrice?: string;
  fullDesc?: string;
  whatToExpect?: string[];
  giaGoc?: number;
  phanTramGiam?: number;
  flashSale?: {
    phanTramGiam: number;
    ngayKetThuc: string;
  };
}

export interface ChiTietTieuDe {
  maCttd: number;
  tenTieuDe: string;
  moTaTieuDe: string;
  hinhAnh?: string;
}

export interface TieuDeDichVu {
  maTd: number;
  tenTieuDe: string;
  moTaTieuDe?: string;
  chiTiet: ChiTietTieuDe[];
}

export interface KieuToc {
  maKt: number;
  tenKieuToc: string;
  hinhAnh: string;
  moTa?: string;
}

export interface ComboItem {
  id: string;
  tenCombo: string;
  gia: number;
  giaGoc: number;
  phanTramGiam?: number;
  ngayKetThuc?: string;
  moTa?: string;
  hinhAnh?: string;
  items: string[];
}

export interface SuggestedService {
  id: string;
  tenDv: string;
  gia: number;
  giaGoc: number;
  phanTramGiam?: number;
  ngayKetThuc?: string;
  thoiGianLam: number;
  moTa?: string;
  hinhAnh?: string;
}

export interface ServiceDetail {
  maDv: string;
  tenDv: string;
  gia: number;
  giaGoc: number;
  phanTramGiam?: number;
  ngayKetThuc?: string;
  thoiGianLam: number;
  moTa: string;
  images: string[];
  tieudeDichvus: TieuDeDichVu[];
  kieuTocs: KieuToc[];
  relatedCombos: ComboItem[];
  suggestedServices: SuggestedService[];
}