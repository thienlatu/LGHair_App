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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useDataStore } from '../../src/stores/useDataStore';
import { userApi } from '../../src/services/userApi';
import { API_BASE_URL } from '../../src/services/apiClient';

/**
 * ------------------------------------------------------------------
 *  LỊCH SỬ MUA HÀNG (Order History)
 *  Rebuilt 1:1 from Figma:
 *  https://www.figma.com/design/R5mRIA2jgnQBjTskNsRtxd/Untitled?node-id=202-2
 *
 *  As with the previous screens: the Figma frame is a fixed 390px
 *  canvas with absolutely-positioned nodes. Rebuilt here with
 *  flexbox (header, search bar, tab row, order-card list) driven by
 *  a `scale()` helper so it holds on any device width — cards flow
 *  in a normal vertical list instead of being pinned at fixed y
 *  offsets, so any number of orders renders correctly.
 *
 *  Visual tokens from the node tree: bg #F8F8F8, cards white rounded
 *  12, search bar border #D9D9D9, tab underline under the active
 *  tab, status badges per state:
 *   - Hoàn thành   → border #B9FFAA, text #36830D
 *   - Chờ xử lý    → bg #FFFFE2, border #F8BB54, text #F8BB54
 *   - Đang giao    → border #8FB7FA, text #4E8DF6
 *   - Đã hủy       → bg #FBF3F3, border #FF8587, text #D20E18
 *  "Inconsolata" for titles/labels/product name, "Inter" for date /
 *  total / button text.
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
  muted: '#5C5C5C',
  searchBorder: '#D9D9D9',
  imagePlaceholder: '#E8E8E8',
};

const FONT = {
  labelBold: Platform.select({ ios: 'Inconsolata-SemiBold', android: 'Inconsolata_600SemiBold', default: 'System' }),
  labelRegular: Platform.select({ ios: 'Inconsolata-Regular', android: 'Inconsolata_400Regular', default: 'System' }),
  body: Platform.select({ ios: 'Inter-Regular', android: 'Inter_400Regular', default: 'System' }),
};

// ---------- Types ----------
type OrderStatus = 'completed' | 'pending' | 'shipping' | 'cancelled';
type OrderFilter = 'all' | OrderStatus;

interface OrderHistoryItem {
  id: string;
  status: OrderStatus;
  productSummary: string;
  date: string;
  amount: number;
  [key: string]: any;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; border: string; text: string }> = {
  completed: { label: 'Hoàn thành', bg: COLORS.white, border: '#B9FFAA', text: '#36830D' },
  pending: { label: 'Chờ xử lý', bg: '#FFFFE2', border: '#F8BB54', text: '#F8BB54' },
  shipping: { label: 'Đang giao', bg: COLORS.white, border: '#8FB7FA', text: '#4E8DF6' },
  cancelled: { label: 'Đã hủy', bg: '#FBF3F3', border: '#FF8587', text: '#D20E18' },
};

const TABS: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'completed', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

// =====================================================================
// FIXED: Cập nhật hàm getImageUrl để check string và xử lý lỗi ngầm
// =====================================================================
const getImageUrl = (path?: any) => {
  if (!path || typeof path !== 'string' || path === 'null' || path === 'undefined' || path.trim() === '') {
    return undefined;
  }
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// =====================================================================
// Status badge
// =====================================================================
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.statusBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// =====================================================================
// Order card
// =====================================================================
function OrderCard({ order, onBuyAgain }: { order: any; onBuyAgain: () => void }) {
  let productName = order.productSummary || order.tenSp || order.TenSp || 'Sản phẩm';
  let variantName = order.tenBienThe || order.TenBienThe || order.variantName || '';
  let quantity = order.soLuong || order.SoLuong || order.quantity;
  let rawImage = order.hinhAnh || order.HinhAnh || order.image;
  let targetMaBienThe = order.maBienThe || order.MaBienThe;
  let targetMaSp = order.maSp || order.MaSp;

  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    const firstItem = order.items[0];
    if (!variantName) variantName = firstItem.tenBienThe || firstItem.TenBienThe || firstItem.variantName || '';
    if (!quantity && quantity !== 0) quantity = firstItem.soLuong || firstItem.SoLuong || firstItem.quantity;
    if (!rawImage) rawImage = firstItem.hinhAnh || firstItem.HinhAnh || firstItem.image || firstItem.hinhAnhDaiDien || firstItem.HinhAnhDaiDien;
    if (!order.productSummary) productName = firstItem.tenSp || firstItem.TenSp || firstItem.productName || productName;
    if (!targetMaBienThe) targetMaBienThe = firstItem.maBienThe || firstItem.MaBienThe;
    if (!targetMaSp) targetMaSp = firstItem.maSp || firstItem.MaSp;
  }

  const globalProducts = useDataStore.getState().PRODUCTS || [];
  
  if (!rawImage || !variantName) {
      const matchedProduct = globalProducts.find((p: any) => {
          const matchSp = targetMaSp && p.maSp === targetMaSp;
          const matchBienThe = targetMaBienThe && p.maBienThe === targetMaBienThe;
          const matchName = p.tenSp && productName.toLowerCase().includes(p.tenSp.toLowerCase());
          
          if (targetMaBienThe) return matchBienThe;
          if (targetMaSp) return matchSp;
          return matchName;
      });

      if (matchedProduct) {
          if (!rawImage) rawImage = matchedProduct.hinhAnhDaiDien;
          if (!variantName && matchedProduct.tenBienThe) variantName = matchedProduct.tenBienThe;
      }
  }

  if (!quantity && quantity !== 0) {
      quantity = 1;
  }

  const finalImageUrl = getImageUrl(rawImage);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderCardTopRow}>
        <Text style={styles.orderCode} numberOfLines={1}>
          Mã đơn : {order.id}
        </Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.orderCardBody}>
        {/* FIXED: Dùng cấu trúc stack absoluteFill để icon làm nền, ảnh đè lên */}
        <View style={styles.orderThumbWrap}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.imagePlaceholder, justifyContent: 'center', alignItems: 'center' }]}>
            <Feather name="box" size={32} color={COLORS.muted} />
          </View>

          {finalImageUrl && (
            <Image source={{ uri: finalImageUrl }} style={styles.orderThumb} contentFit="cover" />
          )}
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderProductName} numberOfLines={2}>{productName}</Text>
          {variantName ? <Text style={styles.orderVariant}>{variantName}</Text> : null}
          <Text style={styles.orderVariant}>x{quantity}</Text>
        </View>
      </View>

      <View style={styles.orderCardDivider} />

      <View style={styles.orderCardBottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderDate}>{order.date}</Text>
          <Text style={styles.orderTotal}>
            Tổng số tiền:    {formatPrice(order.amount)}
          </Text>
        </View>
        {/* <Pressable style={styles.buyAgainBtn} onPress={onBuyAgain}>
          <Text style={styles.buyAgainText}>Mua lại</Text>
        </Pressable> */}
      </View>
    </View>
  );
}

// =====================================================================
// MAIN SCREEN
// =====================================================================
export default function OrderHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OrderFilter>('all');
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.maKH) return;
      try {
        setLoading(true);
        const data = await userApi.getProductOrderHistory(user.maKH);
        setOrders(data);
      } catch (err) {
        console.error("Lỗi lấy lịch sử đơn hàng", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.maKH]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeTab !== 'all') {
      list = list.filter(o => o.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        o => o.id.toLowerCase().includes(q) || 
             (o.productSummary || '').toLowerCase().includes(q) ||
             (o.tenSp || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeTab, searchQuery]);

  return (
    <>
      {/* Search + filter/sort */}
      <View style={styles.searchWrap}>
        <View style={styles.centeredContent}>
          <View style={styles.searchBar}>
            <Feather name="search" size={scale(14)} color={COLORS.muted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm theo mã đơn hoặc sản phẩm..."
              placeholderTextColor="#8A8A8A"
            />
            <View style={styles.searchDivider} />
            <Pressable hitSlop={8} style={styles.searchIconBtn}>
              <Feather name="sliders" size={scale(15)} color={COLORS.muted} />
            </Pressable>
            <Pressable hitSlop={8} style={styles.searchIconBtn}>
              <Feather name="calendar" size={scale(15)} color={COLORS.muted} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                {isActive && <View style={styles.tabUnderline} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: scale(32) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContent}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.black} style={{ marginTop: scale(40) }} />
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={scale(32)} color={COLORS.muted} />
              <Text style={styles.emptyText}>Không có đơn hàng nào.</Text>
            </View>
          ) : (
            filteredOrders.map((order, idx) => (
              <Animated.View key={order.id} entering={FadeInDown.delay(idx * 40)} style={{ marginBottom: scale(14) }}>
                <OrderCard order={order} onBuyAgain={() => { /* TODO: re-add items to cart / booking */ }} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

// =====================================================================
// Styles
// =====================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingTop: scale(16) },
  centeredContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: scale(16),
  },

  // Search bar
  searchWrap: { backgroundColor: COLORS.white, paddingBottom: scale(16) },
  searchBar: {
    height: scale(29),
    borderWidth: 1,
    borderColor: COLORS.searchBorder,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT.labelRegular,
    fontSize: scale(11),
    color: COLORS.black,
    padding: 0,
  },
  searchDivider: {
    width: 1,
    height: scale(18),
    backgroundColor: COLORS.searchBorder,
  },
  searchIconBtn: { paddingHorizontal: scale(2) },

  // Tabs
  tabsWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsRow: {
    paddingHorizontal: scale(16),
    gap: scale(20),
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: scale(12),
  },
  tabText: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(13),
    color: COLORS.black,
  },
  tabTextActive: {
    fontFamily: FONT.labelBold,
  },
  tabUnderline: {
    marginTop: scale(6),
    height: 2,
    width: '100%',
    backgroundColor: COLORS.black,
    borderRadius: 1,
  },

  // Order card
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: scale(12),
  },
  orderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(12),
  },
  orderCode: {
    flex: 1,
    fontFamily: FONT.labelRegular,
    fontSize: scale(13),
    color: COLORS.black,
    marginRight: scale(8),
  },
  statusBadge: {
    height: scale(23),
    minWidth: scale(72),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(8),
  },
  statusBadgeText: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(11),
  },

  orderCardBody: {
    flexDirection: 'row',
    gap: scale(12),
  },
  orderThumbWrap: {
    width: scale(110),
    height: scale(90),
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderThumb: { width: '100%', height: '100%' },
  orderInfo: { flex: 1, paddingTop: scale(4) },
  orderProductName: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(11),
    color: COLORS.black,
    marginBottom: scale(6),
  },
  orderVariant: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(11),
    color: COLORS.muted,
  },

  orderCardDivider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginVertical: scale(12),
  },

  orderCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontFamily: FONT.body,
    fontSize: scale(12),
    color: COLORS.black,
    marginBottom: scale(4),
  },
  orderTotal: {
    fontFamily: FONT.body,
    fontSize: scale(12),
    color: COLORS.black,
  },
  buyAgainBtn: {
    minWidth: scale(90),
    height: scale(32),
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(12),
  },
  buyAgainText: {
    fontFamily: FONT.body,
    fontSize: scale(12),
    color: COLORS.black,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(60),
    gap: scale(10),
  },
  emptyText: {
    fontFamily: FONT.body,
    fontSize: scale(13),
    color: COLORS.muted,
  },
});