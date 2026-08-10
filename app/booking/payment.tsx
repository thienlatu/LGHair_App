import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { createURL } from 'expo-linking';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import PrimaryButton from '../../components/PrimaryButton';
import ErrorModal from '../../components/ui/ErrorModal';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { bookingApi, BookingFinalRequest } from '../../src/services/bookingApi';
import { useCheckoutStore } from '../../src/stores/useCheckoutStore';
import { calculateShippingFee } from '../../src/utils/shippingCalculator';

const VNPAY_LOGO = "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const MAX_CONTENT_WIDTH = 480;
const clampedWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);
const scale = (size: number) => Math.round((clampedWidth / BASE_WIDTH) * size);

const COLORS = {
  bg: '#F8F8F8',
  white: '#FFFFFF',
  black: '#000000',
  muted: '#5C5C5C',
  inputBorder: '#505050',
  boxBorder: 'rgba(221,221,221,0.87)',
  cardBorderLight: '#DDDDDD',
  selectedBg: '#F2F2F2',
  required: '#FF3B30',
};

const FONT = {
  labelBold: Platform.select({ ios: 'Inconsolata-SemiBold', android: 'Inconsolata_600SemiBold', default: 'System' }),
  labelRegular: Platform.select({ ios: 'Inconsolata-Regular', android: 'Inconsolata_400Regular', default: 'System' }),
  inclusive: Platform.select({ ios: 'InclusiveSans-Regular', android: 'InclusiveSans_400Regular', default: 'System' }),
};

const formatPrice = (price: number) => Math.round(price).toLocaleString('vi-VN') + ' đ';

type DepositMode = 'deposit10' | 'full100';
type ProductPaymentMethod = 'vnpay' | 'COD';

interface BookingSummaryData {
  date: string;
  timeRange: string;
  serviceCount: number;
  productCount: number;
}

interface PaymentScreenProps {
  vnpayLogoUri?: string;
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step, idx) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <React.Fragment key={step}>
            <View style={[styles.stepCircle, (isDone || isActive) && styles.stepCircleActive, isDone && { backgroundColor: '#00C800', borderColor: '#00C800' }]}>
              {isDone ? (
                <Feather name="check" size={scale(16)} color={COLORS.white} />
              ) : (
                <Text style={[styles.stepCircleText, isActive && styles.stepCircleTextActive]}>{step}</Text>
              )}
            </View>
            {idx < 2 && <View style={styles.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function LabeledInput({ icon, label, required, value, onChangeText, placeholder, style, multiline }: any) {
  return (
    <View style={style}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredMark}>*</Text>}
      </Text>
      <View style={[styles.inputBox, multiline && styles.inputBoxMultiline]}>
        {icon && <Feather name={icon} size={scale(13)} color={COLORS.black} style={{ marginRight: scale(8) }} />}
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function BookingSummaryBox({ data }: { data: BookingSummaryData }) {
  return (
    <View style={styles.summaryBox}>
      <View style={styles.summaryBoxHeaderRow}>
        <Feather name="calendar" size={scale(12)} color={COLORS.black} />
        <Text style={styles.summaryBoxTitle}>LỊCH HẸN</Text>
      </View>
      <View style={styles.summaryBoxDivider} />
      <View style={styles.summaryBoxBody}>
        <SummaryLine label="Ngày" value={data.date} />
        <SummaryLine label="Giờ" value={data.timeRange} />
        <SummaryLine label="Dịch vụ" value={`x${data.serviceCount}`} />
        {data.productCount > 0 && <SummaryLine label="Sản phẩm" value={`x${data.productCount}`} />}
      </View>
    </View>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryLineRow}>
      <Text style={styles.summaryLineLabel}>{label}</Text>
      <Text style={styles.summaryLineValue}>{value}</Text>
    </View>
  );
}

function DepositOption({ title, subtitle, selected, onPress }: any) {
  return (
    <Pressable style={[styles.depositOption, selected && styles.depositOptionSelected]} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.depositTitle}>{title}</Text>
        <Text style={styles.depositSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function PaymentMethodCard({ variant, label, logoUri, selected, onPress }: any) {
  return (
    <Pressable style={[styles.methodCard, selected && styles.methodCardSelected]} onPress={onPress}>
      {variant === 'vnpay' ? (
        <Image source={{ uri: logoUri }} style={styles.vnpayLogoImg} contentFit="contain" />
      ) : (
        <Text style={styles.methodCardLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

export default function PaymentScreen({ vnpayLogoUri = VNPAY_LOGO }: PaymentScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const user = useAuthStore(state => state.user);
  const { cartItems, selectedServices, deliveryMode, bookingDate, bookingTime, stylistId, clearCheckout } = useCheckoutStore();

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [processingResult, setProcessingResult] = useState(false);

  // States quản lý luồng thanh toán VNPay
  const [paymentUrlToOpen, setPaymentUrlToOpen] = useState<string | null>(null);
  const [pendingMaHd, setPendingMaHd] = useState<string | null>(null);
  const [isServiceOnlyFlow, setIsServiceOnlyFlow] = useState<boolean>(false);

  const [fullName, setFullName] = useState(user?.hoTen || '');
  const [phone, setPhone] = useState(user?.sdt || '');
  const [email, setEmail] = useState(user?.email || '');
  const [note, setNote] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [depositMode, setDepositMode] = useState<DepositMode>('full100');
  const [voucherCode, setVoucherCode] = useState('');
  const [productPaymentMethod, setProductPaymentMethod] = useState<ProductPaymentMethod>('vnpay');
  const [stackPreview, setStackPreview] = useState({ totalDiscount: 0, finalAmount: 0 });

  useEffect(() => {
    if (deliveryMode === 'pickup' && productPaymentMethod !== 'vnpay') {
      setProductPaymentMethod('vnpay');
    }
  }, [deliveryMode]);

  const hasService = () => selectedServices.length > 0;
  const hasProduct = () => cartItems.length > 0;
  const isPickupAtStore = () => deliveryMode === 'pickup';
  const isDelivery = () => deliveryMode === 'delivery';

  const servicesSubtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const productsSubtotal = cartItems.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const combinedSubTotal = servicesSubtotal + productsSubtotal;

  const deliveryFee = (isDelivery() && hasProduct() && deliveryAddress) ? calculateShippingFee(30, deliveryAddress) : 0;
  const totalDiscount = stackPreview.totalDiscount;

  const serviceAfterVoucher = Math.max(0, servicesSubtotal - totalDiscount);
  const remainingDiscount = Math.max(0, totalDiscount - servicesSubtotal);
  const productAfterVoucher = Math.max(0, productsSubtotal - remainingDiscount);

  const productsNet = productAfterVoucher + deliveryFee;
  const netTotal = combinedSubTotal + deliveryFee - totalDiscount;

  let dueNowService = 0;
  let dueNowProduct = 0;

  if (hasService()) {
    if (isPickupAtStore() && hasProduct()) {
      dueNowService = depositMode === 'deposit10' ? (netTotal * 0.1) : netTotal;
      dueNowProduct = 0;
    } else {
      dueNowService = depositMode === 'deposit10' ? (serviceAfterVoucher * 0.1) : serviceAfterVoucher;
    }
  }

  if (hasProduct()) {
    if (isDelivery() || !hasService()) {
      dueNowProduct = productPaymentMethod === 'vnpay' ? productsNet : 0;
    }
  }

  const dueNow = dueNowService + dueNowProduct;
  // Khôi phục lại dòng tính toán số tiền trả tại tiệm
  const dueAtStore = netTotal - dueNow;

  const depositBase = (isPickupAtStore() && hasProduct()) ? netTotal : serviceAfterVoucher;
  const depositSubtitle = useMemo(() => {
    const depositAmt = depositBase * 0.1;
    const remain = depositBase - depositAmt;
    return `${formatPrice(depositAmt)}  thanh toán tại tiệm ${formatPrice(remain)}`;
  }, [depositBase]);
  const fullSubtitle = useMemo(() => `${formatPrice(depositBase)}  không cần trả thêm tại tiệm`, [depositBase]);

  const formatDateDisplay = (apiDate: string) => {
    const parts = apiDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return apiDate;
  };

  const addMinutesToTime = (time: string, minutesToAdd: number) => {
    if (!time) return '--:--';
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutesToAdd;
    const nh = Math.floor(total / 60) % 24;
    const nm = total % 60;
    return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
  };

  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + s.duration, 0) || 60;
  const expectedFinishTime = bookingTime ? addMinutesToTime(bookingTime, totalDurationMinutes) : '...';

  const bookingSummary: BookingSummaryData = {
    date: bookingDate ? formatDateDisplay(bookingDate) : new Date().toLocaleDateString('vi-VN'),
    timeRange: bookingTime ? `${bookingTime} -> ${expectedFinishTime}` : '--:--',
    serviceCount: selectedServices.length,
    productCount: cartItems.length,
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode) return;
    try {
      setVoucherLoading(true);
      const itemIds = [...selectedServices.map(s => s.id), ...cartItems.map(p => p.id)].join(',');
      const res = await bookingApi.previewVoucherStack({
        maKH: user?.maKH || 'GUEST',
        codes: voucherCode,
        subTotal: combinedSubTotal,
        ngayGioHen: bookingDate && bookingTime ? `${bookingDate}T${bookingTime}:00` : undefined,
        itemIds
      });
      setStackPreview({
        totalDiscount: Number(res.totalDiscount) || 0,
        finalAmount: Number(res.finalAmount) || combinedSubTotal
      });
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Mã giảm giá không hợp lệ.');
      setStackPreview({ totalDiscount: 0, finalAmount: combinedSubTotal });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (hasProduct() && isDelivery() && !deliveryAddress) {
      setErrorMsg('Vui lòng nhập địa chỉ giao hàng cho sản phẩm của bạn.');
      return;
    }
    if (!fullName || !phone || !email) {
      setErrorMsg('Vui lòng nhập đầy đủ họ tên, số điện thoại, và email.');
      return;
    }

    try {
      setLoading(true);

      const checkoutType = (hasService() && hasProduct())
        ? 'DAT_LICH_VA_MUA_SAN_PHAM'
        : hasService() ? 'CHI_DAT_LICH' : 'CHI_MUA_SAN_PHAM';

      // PAYLOAD CHUẨN VIẾT HOA THEO ĐÚNG CHECKOUT_SUMMARY_REQUEST CỦA BACKEND
      const payload: any = {
        CheckoutType: checkoutType,
        MaKh: user?.maKH || '', 
        CustomerName: fullName,
        Phone: phone,
        Email: email,
        Note: note,
        BookingDate: bookingDate && bookingTime ? new Date(`${bookingDate}T${bookingTime}:00`).toISOString() : undefined,
        StylistId: stylistId || undefined,
        Services: selectedServices.map(s => ({ 
            Id: s.id, 
            Price: s.price, 
            Duration: s.duration || 30 
        })),
        Products: cartItems.map(p => ({ 
            Id: p.id, 
            Gia: p.price, 
            SoLuong: p.quantity 
        })),
        ReceiveType: isDelivery() ? "home" : "store",
        DeliveryInfo: isDelivery() ? { 
            HoTen: fullName, 
            SoDienThoai: phone, 
            DiaChi: deliveryAddress, 
            Email: email 
        } : undefined,
        VoucherIds: voucherCode ? [voucherCode] : [],
        GrandTotal: netTotal,
        PaidAmount: dueNow,
        ShippingFee: deliveryFee,
        PaymentMode: depositMode === 'deposit10' ? '10' : '100',
        ServicePaymentMethod: "vnpay",
        ProductPaymentMethod: productPaymentMethod,
        InvoiceInfo: {
          LaDoanhNghiep: false,
          EmailNhanHD: email,
          DiaChiXuatHD: deliveryAddress || 'Nhận tại cửa hàng'
        }
      };

      if (hasService() && !hasProduct()) {
        // LUỒNG CHỈ ĐẶT DỊCH VỤ (DatDichVu):
        // Bước 1: Gọi createPayment để lấy link VNPay trước, không gọi submitBooking ngay
        setIsServiceOnlyFlow(true);
        const resPay = await bookingApi.createPayment({
          Amount: dueNow,
          OrderDescription: 'vnpay',
        });
        if (resPay && resPay.url) {
          setPaymentUrlToOpen(resPay.url);
        } else {
          setErrorMsg('Không thể tạo liên kết thanh toán VNPay.');
        }
        return;
      }

      setIsServiceOnlyFlow(false);
      const res = await bookingApi.submitCheckout(payload);

      if (res && res.success) {
        clearCheckout(); // Lưu DB thành công thì xóa sạch giỏ hàng

        if (res.isOnlinePayment && res.url) {
          // Lưu mã Hóa Đơn lại để truyền qua màn hình kết quả
          setPendingMaHd(res.maHd);
          // Mở Popup VNPay
          setPaymentUrlToOpen(res.url);
        } else {
          // Với đơn COD: Chuyển hướng kèm theo mã maHd luôn để gọi get-receipt & gửi Mail
          router.replace(`/booking/payment-result?isCOD=true&maHd=${res.maHd}` as any);
        }
      }

    } catch (err: any) {
      console.log('--- LỖI THANH TOÁN ---', err.response?.data || err.message);
      let serverMsg = err.response?.data?.message || err.response?.data?.title || err.message;
      if (err.response?.data?.innerException) {
        serverMsg += ` | Inner: ${err.response.data.innerException}`;
      }
      setErrorMsg(serverMsg ? `Lỗi Backend: ${serverMsg}` : 'Thanh toán thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn} hitSlop={12}>
          <Feather name="arrow-left" size={scale(22)} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>THANH TOÁN</Text>
        <View style={{ width: scale(22) }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: scale(140) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContent}>
          <StepIndicator currentStep={3} />

          <Animated.View entering={FadeInDown} style={styles.card}>
            <Text style={styles.cardTitle}>1. THÔNG TIN CỦA BẠN</Text>
            <View style={styles.cardTitleDivider} />

            <View style={styles.row2col}>
              <LabeledInput
                icon="user"
                label="Họ và tên"
                required
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập đầy đủ họ tên"
                style={{ flex: 1 }}
              />
              <LabeledInput
                icon="phone"
                label="Số điện thoại"
                required
                value={phone}
                onChangeText={setPhone}
                placeholder="+84 9xxxxxxx"
                style={{ flex: 1 }}
              />
            </View>

            <LabeledInput
              icon="mail"
              label="Email nhận thông báo"
              required
              value={email}
              onChangeText={setEmail}
              placeholder="test@gmail.com"
              style={{ marginTop: scale(14) }}
            />

            {hasProduct() && isDelivery() && (
              <View style={{ marginTop: scale(14) }}>
                <Text style={styles.inputLabel}>
                  Địa chỉ giao hàng chi tiết <Text style={styles.requiredMark}>*</Text>
                </Text>
                <View style={[styles.inputBox, styles.inputBoxMultiline, { height: scale(52) }]}>
                  <TextInput
                    style={[styles.inputText, { height: '100%' }]}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    placeholderTextColor="#999"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            <View style={{ marginTop: scale(14) }}>
              <Text style={styles.inputLabel}>Ghi chú thêm (không bắt buộc)</Text>
              <View style={[styles.inputBox, styles.inputBoxMultiline]}>
                <TextInput
                  style={[styles.inputText, { height: '100%' }]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ví dụ: tôi bị dị ứng với..."
                  placeholderTextColor="#999"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60)} style={[styles.card, { marginTop: scale(20) }]}>
            <Text style={styles.cardTitle}>2. THANH TOÁN</Text>
            <View style={styles.cardTitleDivider} />

            {hasService() && (
              <>
                <BookingSummaryBox data={bookingSummary} />

                <View style={{ gap: scale(10), marginTop: scale(4) }}>
                  <DepositOption
                    title="Cọc trước (10%)"
                    subtitle={depositSubtitle}
                    selected={depositMode === 'deposit10'}
                    onPress={() => setDepositMode('deposit10')}
                  />
                  <DepositOption
                    title="Thanh toán toàn bộ (100%)"
                    subtitle={fullSubtitle}
                    selected={depositMode === 'full100'}
                    onPress={() => setDepositMode('full100')}
                  />
                </View>

                <Text style={[styles.sectionLabel, { marginTop: scale(24) }]}>
                  {isPickupAtStore() && hasProduct() ? "PHƯƠNG THỨC THANH TOÁN TỔNG" : "PHƯƠNG THỨC THANH TOÁN DỊCH VỤ"}
                </Text>
                <View style={styles.methodRow}>
                  <PaymentMethodCard variant="vnpay" selected logoUri={vnpayLogoUri} />
                  <View style={{ flex: 1 }} />
                </View>
              </>
            )}

            <View style={[styles.voucherRow, !hasService() && { marginTop: 0 }]}>
              <TextInput
                style={styles.voucherInput}
                value={voucherCode}
                onChangeText={setVoucherCode}
                placeholder="Nhập mã giảm giá (nếu có)"
                placeholderTextColor="#666"
              />
              <Pressable style={styles.voucherApplyBtn} onPress={handleApplyVoucher} disabled={voucherLoading}>
                {voucherLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.voucherApplyText}>ÁP DỤNG</Text>
                )}
              </Pressable>
            </View>

            {hasProduct() && (!hasService() || isDelivery()) && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: scale(24) }]}>PHƯƠNG THỨC THANH TOÁN SẢN PHẨM</Text>
                <View style={styles.methodRow}>
                  <PaymentMethodCard
                    variant="vnpay"
                    logoUri={vnpayLogoUri}
                    selected={productPaymentMethod === 'vnpay'}
                    onPress={() => setProductPaymentMethod('vnpay')}
                  />
                  <PaymentMethodCard
                    variant="text"
                    label="COD"
                    selected={productPaymentMethod === 'COD'}
                    onPress={() => setProductPaymentMethod('COD')}
                  />
                </View>
              </>
            )}

            <View style={styles.orderSummaryBox}>
              {hasService() && <SummaryLine label="Tạm tính dịch vụ" value={formatPrice(servicesSubtotal)} />}
              {hasProduct() && <SummaryLine label="Tạm tính sản phẩm" value={formatPrice(productsSubtotal)} />}
              {(hasProduct() && isDelivery()) && <SummaryLine label="Phí vận chuyển" value={formatPrice(deliveryFee)} />}
              <SummaryLine label="Tổng tiền giảm" value={formatPrice(totalDiscount)} />

              <View style={styles.orderTotalBlock}>
                <View style={styles.summaryLineRow}>
                  <Text style={styles.orderTotalLabel}>TỔNG ĐƠN HÀNG</Text>
                  <Text style={styles.orderTotalValue}>{formatPrice(netTotal)}</Text>
                </View>
                {hasService() && (
                  <View style={styles.summaryLineRow}>
                    <Text style={styles.orderTotalSubLabel}>+ Tiền dịch vụ</Text>
                    <Text style={styles.orderTotalSubValue}>{formatPrice(servicesSubtotal - (totalDiscount > 0 ? totalDiscount : 0))}</Text>
                  </View>
                )}
                {hasProduct() && (
                  <View style={styles.summaryLineRow}>
                    <Text style={styles.orderTotalSubLabel}>+ Tiền sản phẩm (đã có ship)</Text>
                    <Text style={styles.orderTotalSubValue}>{formatPrice(productsNet)}</Text>
                  </View>
                )}
              </View>

              {dueAtStore > 0 && <SummaryLine label="Thanh toán thêm tại tiệm" value={formatPrice(dueAtStore)} />}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(12)) }]}>
        <View style={styles.centeredContent}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>THANH TOÁN NGAY</Text>
              <Text style={styles.footerAmount}>{formatPrice(dueNow)}</Text>
            </View>
            <PrimaryButton title="THANH TOÁN NGAY" onPress={handlePayNow} style={styles.footerBtn} disabled={loading} />
          </View>
        </View>
      </View>

      {(loading || processingResult) && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 10 }]}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.white} />
            <Text style={{ color: COLORS.white, marginTop: 12, fontFamily: FONT.labelBold }}>
              Đang xử lý thanh toán...
            </Text>
          </View>
        </View>
      )}

      <ErrorModal visible={!!errorMsg} message={errorMsg} onClose={() => setErrorMsg('')} />

      {/* --- CỬA SỔ VNPAY NGẦM TRONG APP --- */}
      <Modal visible={!!paymentUrlToOpen} animationType="slide" onRequestClose={() => setPaymentUrlToOpen(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>

          <View style={[styles.header, { borderBottomWidth: 1, paddingVertical: 10 }]}>
            <Pressable onPress={() => setPaymentUrlToOpen(null)} style={{ padding: 10 }}>
              <Feather name="x" size={24} color="black" />
            </Pressable>
            <Text style={styles.headerTitle}>Cổng Thanh Toán VNPay</Text>
            <View style={{ width: 44 }} />
          </View>

          {!!paymentUrlToOpen && (
            <WebView
              source={{ uri: paymentUrlToOpen }}
              style={{ flex: 1 }}
              onNavigationStateChange={(navState) => {
                // Kiểm tra URL trả về từ VNPay
                if (navState.url.includes('localhost:5173') || navState.url.includes('vnp_ResponseCode')) {
                  
                  // 1. Đóng cửa sổ VNPay
                  setPaymentUrlToOpen(null);
                  // Bật cờ xử lý để hiện UI xoay vòng chờ đợi
                  setProcessingResult(true);

                  // 2. Tách chuỗi Query String
                  const queryString = navState.url.split('?')[1] || '';

                  // 3. Chuyển hướng về trang Kết Quả trên App kèm theo toàn bộ QueryString & maHd
                  // Trang Kết Quả sẽ dùng maHd để gọi API get-receipt và kích hoạt gửi mail giống hệt Web
                  if (queryString.includes('vnp_ResponseCode=00')) {
                    if (isServiceOnlyFlow) {
                      // BƯỚC 3: KHI THANH TOÁN VNPAY THÀNH CÔNG -> GỌI API LƯU LỊCH HẸN VÀO DB
                      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
                      const generatedBookingId = `LD${Date.now()}${randomSuffix}`;
                      const bookingPayload: BookingFinalRequest = {
                        MaKh: user?.maKH || 'GUEST',
                        HoTen: fullName,
                        Phone: phone,
                        Email: email,
                        BookingId: generatedBookingId,
                        Services: selectedServices.map((s) => ({ Id: s.id, Price: s.price })),
                        MaCodes: voucherCode ? [voucherCode] : [],
                        NgayHen: bookingDate && bookingTime
                          ? new Date(`${bookingDate}T${bookingTime}:00`).toISOString()
                          : new Date().toISOString(),
                        InvoiceInfo: {
                          LaDoanhNghiep: false,
                          EmailNhanHD: email,
                          DiaChiXuatHD: 'Nhận tại cửa hàng',
                        },
                      };

                      const paymentModeParam = depositMode === 'deposit10' ? '10' : '100';
                      bookingApi
                        .submitBooking(bookingPayload, paymentModeParam, stylistId || undefined)
                        .then((resBooking) => {
                          clearCheckout();
                          router.replace(
                            `/booking/payment-result?${queryString}&maHd=${resBooking.maLd}` as any
                          );
                        })
                        .catch((err) => {
                          console.log('--- LỖI LƯU ĐẶT LỊCH SAU THANH TOÁN ---', err);
                          setErrorMsg('Lỗi lưu lịch hẹn sau khi thanh toán thành công.');
                        });
                    } else {
                      router.replace(`/booking/payment-result?${queryString}&maHd=${pendingMaHd}` as any);
                      // Không setProcessingResult(false) vì đang replace route
                    }
                  } else {
                    router.replace(`/booking/payment-result?${queryString}` as any);
                  }
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingTop: scale(4) },
  centeredContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: scale(16),
  },
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBackBtn: { padding: scale(4) },
  headerTitle: { fontFamily: FONT.labelBold, fontSize: scale(16), color: COLORS.black, textAlign: 'center' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(24),
  },
  stepCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  stepCircleText: { fontFamily: FONT.labelRegular, fontSize: scale(15), color: COLORS.black },
  stepCircleTextActive: { color: COLORS.white },
  stepLine: { width: scale(27), height: 1, backgroundColor: COLORS.inputBorder, marginHorizontal: scale(6) },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: scale(16) },
  cardTitle: { fontFamily: FONT.labelBold, fontSize: scale(15), color: COLORS.black },
  cardTitleDivider: { height: 1, backgroundColor: '#EAEAEA', marginTop: scale(10), marginBottom: scale(16) },
  row2col: { flexDirection: 'row', gap: scale(12) },
  inputLabel: { fontFamily: FONT.labelRegular, fontSize: scale(12), color: COLORS.black, marginBottom: scale(6) },
  requiredMark: { color: COLORS.required, fontFamily: FONT.labelBold },
  inputBox: {
    height: scale(24),
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    paddingHorizontal: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxMultiline: { height: scale(70), alignItems: 'flex-start', paddingVertical: scale(8) },
  inputText: { flex: 1, fontFamily: FONT.labelRegular, fontSize: scale(11), color: COLORS.black, padding: 0 },
  summaryBox: {
    borderWidth: 1,
    borderColor: COLORS.boxBorder,
    borderRadius: 4,
    padding: scale(12),
    marginBottom: scale(20),
  },
  summaryBoxHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  summaryBoxTitle: { fontFamily: FONT.labelBold, fontSize: scale(13), color: COLORS.black },
  summaryBoxDivider: { height: 1, backgroundColor: '#E5E5E5', marginVertical: scale(10) },
  summaryBoxBody: { gap: scale(10) },
  summaryLineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLineLabel: { fontFamily: FONT.inclusive, fontSize: scale(14), color: COLORS.black },
  summaryLineValue: { fontFamily: FONT.inclusive, fontSize: scale(14), color: COLORS.black },
  sectionLabel: {
    fontFamily: FONT.labelBold,
    fontSize: scale(12),
    color: COLORS.black,
    marginBottom: scale(10),
    letterSpacing: 0.3,
  },
  depositOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    minHeight: scale(70),
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    borderRadius: 4,
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    backgroundColor: COLORS.white,
  },
  depositOptionSelected: { backgroundColor: COLORS.selectedBg, borderColor: COLORS.black },
  radioOuter: {
    width: scale(14),
    height: scale(14),
    borderRadius: scale(7),
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.black },
  radioInner: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: COLORS.black },
  depositTitle: { fontFamily: FONT.labelRegular, fontSize: scale(15), color: COLORS.black, marginBottom: scale(4) },
  depositSubtitle: { fontFamily: FONT.labelRegular, fontSize: scale(12), color: COLORS.muted },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginTop: scale(16),
  },
  voucherInput: {
    flex: 1,
    height: scale(40),
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 4,
    paddingHorizontal: scale(12),
    fontFamily: FONT.labelRegular,
    fontSize: scale(12),
    color: COLORS.black,
  },
  voucherApplyBtn: {
    width: scale(95),
    height: scale(40),
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  voucherApplyText: { fontFamily: FONT.labelRegular, fontSize: scale(12), color: COLORS.white },
  methodRow: { flexDirection: 'row', gap: scale(12) },
  methodCard: {
    flex: 1,
    height: scale(87),
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: scale(12),
  },
  methodCardSelected: { borderColor: COLORS.black, borderWidth: 1.5 },
  methodCardLabel: { fontFamily: FONT.labelBold, fontSize: scale(15), color: COLORS.black },
  vnpayLogoImg: { width: '80%', height: '60%' },
  orderSummaryBox: {
    marginTop: scale(24),
    borderWidth: 1,
    borderColor: COLORS.cardBorderLight,
    borderRadius: 4,
    padding: scale(12),
    gap: scale(14),
  },
  orderTotalBlock: {
    backgroundColor: COLORS.black,
    borderRadius: 4,
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    gap: scale(10),
  },
  orderTotalLabel: { fontFamily: FONT.inclusive, fontSize: scale(14), color: COLORS.white },
  orderTotalValue: { fontFamily: FONT.inclusive, fontSize: scale(15), color: COLORS.white },
  orderTotalSubLabel: { fontFamily: FONT.inclusive, fontSize: scale(13), color: '#DDDDDD' },
  orderTotalSubValue: { fontFamily: FONT.inclusive, fontSize: scale(13), color: '#DDDDDD' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.black,
    paddingTop: scale(14),
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLabel: { fontFamily: FONT.labelRegular, fontSize: scale(13), color: COLORS.black },
  footerAmount: { fontFamily: FONT.labelRegular, fontSize: scale(16), color: COLORS.black, marginTop: scale(4) },
  footerBtn: { width: scale(160), height: scale(43), borderRadius: 0 },
  checkbox: { width: scale(18), height: scale(18), borderRadius: 4, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
});