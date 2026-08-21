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
  FlatList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../../components/PrimaryButton';
import ErrorModal from '../../components/ui/ErrorModal';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useDataStore } from '../../src/stores/useDataStore';
import { useCheckoutStore } from '../../src/stores/useCheckoutStore';
import { useCartStore } from '../../src/stores/useCartStore';
import { useDebounce } from '../../src/hooks/useDebounce';
import { bookingApi, BookingServiceItem } from '../../src/services/bookingApi';
import apiClient, { API_BASE_URL } from '../../src/services/apiClient';
import { ProductListItem } from '../../src/types';
import SearchModal from '../../components/SearchModal';
import CartItemRow, { CartLineItem } from '../../components/CartItemRow';
import ItemCard from '../../components/ItemCard';
import { calculateShippingFee } from '../../src/utils/shippingCalculator';
import { getImageUrl } from '../../src/utils/imageUtils';


/**
 * ------------------------------------------------------------------
 *  ĐẶT LỊCH — XÁC NHẬN ĐƠN HÀNG
 *  Tích hợp logic gọi API thật và tìm kiếm dịch vụ/sản phẩm trực tiếp
 * ------------------------------------------------------------------
 */

// ---------- Responsive scale helper (base design width = 390) ----------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const MAX_CONTENT_WIDTH = 480;
const clampedWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);
const scale = (size: number) => Math.round((clampedWidth / BASE_WIDTH) * size);

const COLORS = {
  bg: '#F8F8F8',
  white: '#FFFFFF',
  black: '#000000',
  text: '#000000',
  muted: '#5C5C5C',
  price: '#E90D0D',
  borderLight: '#D9D9D9',
  borderLighter: '#E1E1E1',
  borderLightest: '#F0F0F0',
  mint: 'rgba(135,255,129,0.81)',
  imagePlaceholder: '#E8E8E8',
  overlay: 'rgba(0,0,0,0.5)',
};

const FONT = {
  labelBold: 'Inter_600SemiBold',
  labelRegular: 'Inconsolata_400Regular',
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
  jaldi: 'Inter_400Regular',
  plexBold: 'Inter_600SemiBold',
  plexRegular: 'Inter_400Regular',
};

// ---------- Types ----------
type DeliveryMode = 'pickup' | 'delivery';
type SearchMode = 'service' | 'product' | null;

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

// =====================================================================
// Helper UI Components
// =====================================================================

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step, idx) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isCompleted && styles.stepCircleCompleted
              ]}
            >
              {isCompleted ? (
                <Feather name="check" size={scale(20)} color={COLORS.white} />
              ) : (
                <Text style={[styles.stepCircleText, isActive && styles.stepCircleTextActive]}>
                  {step}
                </Text>
              )}
            </View>
            {idx < 2 && <View style={styles.stepLine} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SectionHeader({ title, total }: { title: string; total?: number }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderLabel}>{title}</Text>
      {typeof total === 'number' && <Text style={styles.sectionHeaderTotal}>Total: {total}</Text>}
    </View>
  );
}

// Removed ItemCard and CartItemRow (imported from components)

function SubtotalBar({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.subtotalBar}>
      <Text style={styles.subtotalLabel}>{label}</Text>
      <Text style={styles.subtotalAmount}>{formatPrice(amount)}</Text>
    </View>
  );
}

function AddItemSearchBar({ placeholder, onPress }: { placeholder: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.searchBar} onPress={onPress}>
      <Feather name="search" size={scale(14)} color={COLORS.muted} />
      <Text style={styles.searchBarText}>{placeholder}</Text>
    </Pressable>
  );
}

function DeliveryModeToggle({ mode, onChange, fee }: { mode: DeliveryMode; onChange: (m: DeliveryMode) => void; fee: number }) {
  return (
    <View style={styles.deliveryRow}>
      <Pressable
        style={[styles.deliveryOption, mode === 'pickup' ? styles.deliveryOptionActive : styles.deliveryOptionInactive]}
        onPress={() => onChange('pickup')}
      >
        <Ionicons name="storefront-outline" size={scale(16)} color={mode === 'pickup' ? COLORS.white : COLORS.black} />
        <View>
          <Text style={[styles.deliveryTitle, mode === 'pickup' && styles.textWhite]}>Nhận tại tiệm</Text>
          <Text style={[styles.deliverySub, mode === 'pickup' && styles.textWhite]}>Miễn phí</Text>
        </View>
      </Pressable>

      <Pressable
        style={[styles.deliveryOption, mode === 'delivery' ? styles.deliveryOptionActive : styles.deliveryOptionInactive]}
        onPress={() => onChange('delivery')}
      >
        <Feather name="truck" size={scale(14)} color={mode === 'delivery' ? COLORS.white : COLORS.black} />
        <View>
          <Text style={[styles.deliveryTitle, mode === 'delivery' && styles.textWhite]}>Giao tận nhà</Text>
          <Text style={[styles.deliverySub, mode === 'delivery' && styles.textWhite]}>Có phí ship</Text>
        </View>
      </Pressable>
    </View>
  );
}

// =====================================================================
// MAIN SCREEN
// =====================================================================
export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string; serviceIds?: string }>();
  const { user } = useAuthStore();
  const SERVICES = useDataStore(state => state.SERVICES);
  const COMBOS = useDataStore(state => state.COMBOS);
  const PRODUCTS = useDataStore(state => state.PRODUCTS);
  const globalCartItems = useCartStore(state => state.items);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ---------- Backend Data States ----------
  const [servicesData, setServicesData] = useState<BookingServiceItem[]>([]);
  const [combosData, setCombosData] = useState<BookingServiceItem[]>([]);
  const [allProducts, setAllProducts] = useState<ProductListItem[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<ProductListItem[]>([]);

  // ---------- User Selections ----------
  const { selectedServiceIds, setSelectedServiceIds } = useCheckoutStore();
  const [cartItems, setCartItems] = useState<CartLineItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup');

  // ---------- Search Modal States ----------
  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // ---------- Fetch Data on Mount ----------
  useEffect(() => {
    fetchData();
  }, []);

  // Đổ dữ liệu từ Giỏ Hàng (Global) vào màn hình Đặt Lịch (Local) khi dữ liệu sẵn sàng
  useEffect(() => {
    if (globalCartItems) {
      const mappedCart = globalCartItems.map(item => ({
        id: item.id,
        loai: item.loai,
        name: item.ten,
        price: item.gia,
        quantity: item.soLuong,
        image: item.hinhAnh
      }));
      setCartItems(mappedCart);
    }
  }, [globalCartItems]);

  // Handle params if navigated from service details (ĐẶT LỊCH NGAY)
  useEffect(() => {
    if (params.serviceId && servicesData.length > 0) {
      if (!selectedServiceIds.includes(params.serviceId)) {
        setSelectedServiceIds(prev => [...prev, params.serviceId!]);
      }
    }
  }, [params.serviceId, servicesData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Lấy danh sách dịch vụ & combo trực tiếp từ Zustand (đã cache) thay vì gọi API chậm
      const mappedServices = (SERVICES || []).map(s => ({
        id: s.maDv,
        name: s.tenDv,
        price: s.gia,
        originalPrice: s.gia, // Cập nhật lại giá gốc
        duration: s.thoiGianLam || 30,
        icon: "fas fa-cut"
      }));

      const mappedCombos = (COMBOS || []).map(c => ({
        id: c.maCb || c.id,
        name: c.tenCombo || c.name,
        price: c.gia || c.price,
        originalPrice: c.gia,
        duration: c.thoiGianLam || c.duration || 30,
        icon: "fas fa-layer-group"
      }));

      setServicesData(mappedServices as any);
      setCombosData(mappedCombos as any);

      // Lấy danh sách sản phẩm từ useDataStore
      setAllProducts(PRODUCTS);

      // Select 3 random products as suggestions for "SẢN PHẨM MUA KÈM"
      if (PRODUCTS.length > 0) {
        const shuffled = [...PRODUCTS].sort(() => 0.5 - Math.random());
        setSuggestedProducts(shuffled.slice(0, 3));
      }

    } catch (e: any) {
      setErrorMsg('Lỗi nạp dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Nếu PRODUCTS load sau, ta cập nhật lại
  useEffect(() => {
    if (PRODUCTS && PRODUCTS.length > 0) {
      setAllProducts(PRODUCTS);
      if (suggestedProducts.length === 0) {
        const shuffled = [...PRODUCTS].sort(() => 0.5 - Math.random());
        setSuggestedProducts(shuffled.slice(0, 3));
      }
    }
  }, [PRODUCTS]);

  // ---------- Computations ----------
  const selectedServices = useMemo(() => {
    const all = [...servicesData, ...combosData];
    return all.filter(s => selectedServiceIds.includes(s.id));
  }, [selectedServiceIds, servicesData, combosData]);

  const servicesSubtotal = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );

  const totalDurationMinutes = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0),
    [selectedServices]
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cartItems]
  );

  const deliveryFeeBase = calculateShippingFee(5, 'Buôn Ma Thuột, Đắk Lắk'); // Mocking 5km distance and address for now
  const deliveryFee = deliveryMode === 'delivery' && cartItems.length > 0 ? deliveryFeeBase : 0;
  const grandTotal = servicesSubtotal + cartSubtotal + deliveryFee;

  // ---------- Handlers ----------
  const handleRemoveService = (id: string) => {
    setSelectedServiceIds(prev => prev.filter(s => s !== id));
  };

  const handleAddProductToCart = (product: ProductListItem) => {
    const productId = product.maBienThe || product.maSp;
    const productName = product.tenBienThe ? `${product.tenSp} - ${product.tenBienThe}` : product.tenSp;
    const productPrice = product.giaBan || product.giaTu || 0;

    // Lưu state cũ để rollback
    const previousCartItems = [...cartItems];

    // Optimistic UI Update
    setCartItems(prev => {
      const exists = prev.find(item => item.id === productId);
      if (exists) {
        return prev.map(item => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        id: productId,
        loai: 'BIENTHE',
        name: productName,
        price: productPrice,
        quantity: 1,
        image: product.hinhAnhDaiDien
      }];
    });

    // Background Global Sync
    useCartStore.getState().addVariant(productId, 1).catch((e) => {
      // Rollback
      setCartItems(previousCartItems);
      const serverMsg = e.response?.data?.message || e.message;
      setErrorMsg(`Lỗi: ${serverMsg}`);
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    const previousCartItems = [...cartItems];

    // Optimistic UI Update
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );

    // Background Global Sync
    const item = cartItems.find(i => i.id === id);
    if (item) {
      const newQty = Math.max(1, item.quantity + delta);
      useCartStore.getState().updateQuantity(id, item.loai || 'BIENTHE', newQty).catch(e => {
        setCartItems(previousCartItems);
        const serverMsg = e.response?.data?.message || e.message;
        setErrorMsg(`Lỗi: ${serverMsg}`);
      });
    }
  };

  const handleRemoveCartItem = (id: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: () => {
            const previousCartItems = [...cartItems];
            
            // Optimistic UI Update
            setCartItems(prev => prev.filter(item => item.id !== id));

            // Background Global Sync
            const item = cartItems.find(i => i.id === id);
            if (item) {
              useCartStore.getState().removeItem(id, item.loai || 'BIENTHE').catch(e => {
                setCartItems(previousCartItems);
                const serverMsg = e.response?.data?.message || e.message;
                setErrorMsg(`Lỗi: ${serverMsg}`);
              });
            }
          }
        }
      ]
    );
  };

  const { setCartItems: setStoreCartItems, setSelectedServices: setStoreSelectedServices, setDeliveryMode: setStoreDeliveryMode } = useCheckoutStore();

  const handleContinue = () => {
    if (selectedServices.length === 0 && cartItems.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 dịch vụ hoặc sản phẩm để tiếp tục.');
      return;
    }

    // Lưu trạng thái vào Checkout Store
    setStoreCartItems(cartItems);
    setStoreSelectedServices(selectedServices as any);
    setStoreDeliveryMode(deliveryMode);

    // Nếu KHÔNG có dịch vụ (chỉ mua sản phẩm) -> Skip trang Lịch Hẹn, tới thẳng Thanh Toán
    if (selectedServices.length === 0 && cartItems.length > 0) {
      router.push({
        pathname: '/booking/payment'
      });
    } else {
      // Nếu có dịch vụ -> Đi qua trang chọn Lịch Hẹn (schedule)
      router.push({
        pathname: '/booking/schedule'
      });
    }
  };

  // ---------- Search Modal Handlers ----------
  const filteredSearchResults = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();

    if (searchMode === 'service') {
      const all = [...servicesData, ...combosData];
      if (!query) return all.filter(s => !selectedServiceIds.includes(s.id));
      return all.filter(s => s.name?.toLowerCase()?.includes(query) && !selectedServiceIds.includes(s.id));
    }
    if (searchMode === 'product') {
      if (!query) return allProducts;
      return allProducts.filter(p => p.tenSp?.toLowerCase()?.includes(query));
    }
    return [];
  }, [debouncedSearchQuery, searchMode, servicesData, combosData, allProducts, selectedServiceIds]);

  const onSelectSearchResult = (item: any) => {
    if (searchMode === 'service') {
      setSelectedServiceIds(prev => [...prev, item.id]);
    } else if (searchMode === 'product') {
      handleAddProductToCart(item);
    }
    setSearchMode(null);
    setSearchQuery('');
  };

  // ---------- Helper for images ----------
  const getServiceImage = (svc: BookingServiceItem) => {
    // 1. Check in SERVICES
    const fullService = (SERVICES || []).find(s => s.maDv === svc.id);
    if (fullService?.hinhAnhs && fullService.hinhAnhs.length > 0) {
      return fullService.hinhAnhs[0].duongDan;
    }
    if (fullService?.hinhAnh) {
      return fullService.hinhAnh;
    }

    // 2. Check in COMBOS
    const fullCombo = (COMBOS || []).find(c => c.maCb === svc.id);
    if (fullCombo?.hinhAnhs && fullCombo.hinhAnhs.length > 0) {
      return fullCombo.hinhAnhs[0].duongDan;
    }
    if (fullCombo?.hinhAnh) {
      return fullCombo.hinhAnh;
    }

    // 3. Fallback to icon (e.g. "fas fa-cut")
    return svc.icon || '';
  };

  // ---------- Render Not Logged In ----------
  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(24) }]}>
        <Feather name="lock" size={scale(64)} color={COLORS.black} style={{ marginBottom: scale(24) }} />
        <Text style={{ fontFamily: FONT.labelBold, fontSize: scale(18), marginBottom: scale(8), textAlign: 'center' }}>BẠN CHƯA ĐĂNG NHẬP</Text>
        <Text style={{ fontFamily: FONT.body, fontSize: scale(15), color: COLORS.muted, textAlign: 'center', marginBottom: scale(32) }}>Vui lòng đăng nhập để sử dụng tính năng đặt lịch hẹn.</Text>
        <PrimaryButton title="ĐĂNG NHẬP NGAY" onPress={() => router.push('/login')} style={{ width: '100%' }} />
      </View>
    );
  }

  // ---------- Render Modal ----------
  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBackBtn} hitSlop={12}>
          <Feather name="arrow-left" size={scale(22)} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>XÁC NHẬN ĐƠN HÀNG</Text>
        <View style={{ width: scale(22) }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: scale(260) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContent}>
          <StepIndicator currentStep={1} />

          {/* DỊCH VỤ ĐÃ CHỌN */}
          <Animated.View entering={FadeInDown}>
            <SectionHeader title="DỊCH VỤ ĐÃ CHỌN" total={selectedServices.length} />
            {selectedServices.length === 0 ? (
              <Text style={styles.emptyListText}>Chưa có dịch vụ nào được chọn.</Text>
            ) : (
              <View style={styles.cardList}>
                {selectedServices.map(s => (
                  <ItemCard
                    key={s.id}
                    image={getServiceImage(s)}
                    name={s.name}
                    durationMinutes={s.duration}
                    price={s.price}
                    onOptionsPress={() => handleRemoveService(s.id)}
                  />
                ))}
              </View>
            )}
            <SubtotalBar label="TẠM TÍNH DỊCH VỤ" amount={servicesSubtotal} />
            <AddItemSearchBar placeholder="Tìm và thêm dịch vụ..." onPress={() => setSearchMode('service')} />
          </Animated.View>

          {/* SẢN PHẨM GIỎ HÀNG */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.cartSection}>
            <Text style={styles.cartSectionTitle}>SẢN PHẨM GIỎ HÀNG</Text>
            {cartItems.length === 0 ? (
              <Text style={[styles.emptyListText, { textAlign: 'center' }]}>Giỏ hàng của bạn đang trống.</Text>
            ) : (
              <View style={styles.cartList}>
                {cartItems.map(item => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onIncrease={() => handleUpdateCartQuantity(item.id, 1)}
                    onDecrease={() => handleUpdateCartQuantity(item.id, -1)}
                    onRemove={() => handleRemoveCartItem(item.id)}
                  />
                ))}
              </View>
            )}
            <View style={{ marginTop: scale(16) }}>
              <SubtotalBar label="TẠM TÍNH SẢN PHẨM" amount={cartSubtotal} />
            </View>

            {/* NHẬN SẢN PHẨM (Chỉ hiển thị nếu có sản phẩm trong giỏ) */}
            {cartItems.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150)} style={{ marginTop: scale(24) }}>
                <Text style={styles.receiveLabel}>NHẬN SẢN PHẨM</Text>
                <DeliveryModeToggle mode={deliveryMode} onChange={setDeliveryMode} fee={deliveryFeeBase} />

                <View style={styles.noteBanner}>
                  <Feather name="check-circle" size={scale(14)} color={COLORS.black} />
                  <Text style={styles.noteText}>
                    {deliveryMode === 'pickup'
                      ? 'Bạn có thể nhận sản phẩm trực tiếp khi đến làm dịch vụ tại tiệm.'
                      : 'Sản phẩm sẽ được giao đến địa chỉ của bạn trong 24–48h sau khi đặt.'}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* SẢN PHẨM GỢI Ý */}
          <Animated.View entering={FadeInDown.delay(50)} style={{ marginTop: scale(28) }}>
            <SectionHeader title="SẢN PHẨM GỢI Ý" />
            <View style={styles.cardList}>
              {suggestedProducts.map((p, index) => (
                <ItemCard
                  key={p.maBienThe || p.maSp || index.toString()}
                  image={p.hinhAnhDaiDien}
                  name={`${p.tenSp} - ${p.tenBienThe || ''}`}
                  price={p.giaBan || p.giaTu || 0}
                  iconName="plus"
                  onOptionsPress={() => handleAddProductToCart(p)}
                />
              ))}
            </View>
            <AddItemSearchBar placeholder="Tìm và thêm sản phẩm..." onPress={() => setSearchMode('product')} />
          </Animated.View>
        </View>
      </ScrollView>

      {/* FIXED FOOTER */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, scale(12)), bottom: scale(65) }]}>
        <View style={styles.centeredContent}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>TỔNG TẠM TÍNH</Text>
              <Text style={styles.footerAmount}>{formatPrice(grandTotal)}</Text>
            </View>
            <PrimaryButton
              title="TIẾP TỤC"
              onPress={handleContinue}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.black} />
        </View>
      )}

      <SearchModal
        visible={!!searchMode}
        searchMode={searchMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClose={() => { setSearchMode(null); setSearchQuery(''); }}
        filteredSearchResults={filteredSearchResults}
        onSelectSearchResult={onSelectSearchResult}
        getServiceImage={getServiceImage}
      />

      <ErrorModal visible={!!errorMsg} message={errorMsg} onClose={() => setErrorMsg('')} />
    </>
  );
}

// =====================================================================
// STYLES
// =====================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingTop: scale(4),
  },
  centeredContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: scale(16),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.overlay,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar
  searchBar: {
    marginTop: scale(10),
    height: scale(38),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    gap: scale(8),
  },
  searchBarText: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(13),
    color: COLORS.black,
  },
  // Subtotal bar
  subtotalBar: {
    backgroundColor: COLORS.black,
    borderRadius: 4,
    height: scale(45),
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtotalLabel: {
    fontFamily: FONT.labelBold,
    fontSize: scale(15),
    color: COLORS.white,
  },
  subtotalAmount: {
    fontFamily: FONT.labelBold,
    fontSize: scale(15),
    color: COLORS.white,
  },
  // Cards
  cardList: {
    gap: scale(10),
    marginTop: scale(4),
    marginBottom: scale(12),
  },
  emptyListText: {
    fontFamily: FONT.body,
    fontSize: scale(13),
    color: COLORS.muted,
    marginVertical: scale(12),
  },
  // Cart Section
  cartSection: {
    marginTop: scale(24),
    backgroundColor: COLORS.white,
    borderRadius: 4,
    paddingVertical: scale(16),
    paddingHorizontal: scale(12),
  },
  cartSectionTitle: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(15),
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: scale(12),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLighter,
  },
  cartList: {
    gap: scale(12),
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLightest,
  },
  headerBackBtn: {
    padding: scale(4),
  },
  headerTitle: {
    fontFamily: FONT.labelBold,
    fontSize: scale(18),
    color: COLORS.black,
    textAlign: 'center',
  },

  // Step indicator
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
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.black,
    borderColor: COLORS.black,
  },
  stepCircleCompleted: {
    backgroundColor: '#00C800',
    borderColor: '#00C800',
  },
  stepCircleText: {
    fontFamily: FONT.body,
    fontSize: scale(16),
    color: COLORS.black,
  },
  stepCircleTextActive: {
    color: COLORS.white,
  },
  stepLine: {
    width: scale(27),
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: scale(6),
  },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: scale(12),
    paddingBottom: scale(8),
  },
  sectionHeaderLabel: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(15),
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  sectionHeaderTotal: {
    fontFamily: FONT.body,
    fontSize: scale(13),
    color: COLORS.black,
  },



  // Delivery
  receiveLabel: {
    fontFamily: FONT.body,
    fontSize: scale(13),
    color: COLORS.muted,
    marginBottom: scale(10),
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  deliveryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    height: scale(40),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLightest,
    paddingHorizontal: scale(12),
  },
  deliveryOptionActive: {
    backgroundColor: COLORS.black,
  },
  deliveryOptionInactive: {
    backgroundColor: COLORS.white,
  },
  deliveryTitle: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(13),
    color: COLORS.black,
  },
  deliverySub: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(12),
    color: COLORS.black,
  },
  textWhite: {
    color: COLORS.white,
  },
  noteBanner: {
    marginTop: scale(12),
    backgroundColor: COLORS.mint,
    borderWidth: 1,
    borderColor: COLORS.borderLightest,
    borderRadius: 4,
    minHeight: scale(30),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  noteText: {
    flex: 1,
    fontFamily: FONT.labelRegular,
    fontSize: scale(12),
    color: COLORS.black,
    lineHeight: scale(13),
  },

  // Footer
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLabel: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(16),
    color: COLORS.black,
  },
  footerAmount: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(18),
    color: COLORS.black,
    marginTop: scale(4),
  },
  footerBtn: {
    width: scale(174),
    height: scale(43),
    borderRadius: 0,
  },
});