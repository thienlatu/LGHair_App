// Địa chỉ kho mặc định
export const KHO_ORIGIN = "C01- 03 đường 10 tháng 3, Phường Thành Nhất, TP Buôn Ma Thuột, Tỉnh Đăk Lăk";

/**
 * Tính phí giao hàng dựa trên khoảng cách và địa chỉ
 * - Trong tỉnh (Đắk Lắk): 500đ/km
 * - Ngoại tỉnh: 1000đ/km
 * - Bất kể ở đâu, nếu > 75km: 500đ/km
 */
export const calculateShippingFee = (distanceKm: number, destinationAddress: string): number => {
    // Làm tròn khoảng cách lên (VD: 2.3km -> 3km để tính phí, tùy bạn điều chỉnh)
    const km = Math.ceil(distanceKm);
    
    // Kiểm tra xem địa chỉ có thuộc tỉnh Đắk Lắk không
    const destLower = destinationAddress.toLowerCase();
    const isTrongTinh = destLower.includes("đắk lắk") || 
                        destLower.includes("dak lak") || 
                        destLower.includes("buôn ma thuột");

    let feePerKm = 0;

    if (km > 75) {
        feePerKm = 500;
    } else if (isTrongTinh) {
        feePerKm = 500;
    } else {
        feePerKm = 1000; // Ngoại tỉnh và <= 75km
    }

    return km * feePerKm;
};
