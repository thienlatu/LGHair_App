import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { userApi } from '../../src/services/userApi';

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

type BookingStatus = 'pending' | 'paid-full' | 'completed' | 'cancelled';
type BookingFilter = 'all' | BookingStatus;

interface BookingHistoryItem {
  id: string;
  date: string;
  service: string;
  amount: number;
  status: BookingStatus;
  serviceCount: number;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; border: string; text: string }> = {
  completed: { label: 'Hoàn thành', bg: COLORS.white, border: '#B9FFAA', text: '#36830D' },
  'paid-full': { label: 'Đã thanh toán', bg: '#E6F4EA', border: '#34A853', text: '#34A853' },
  cancelled: { label: 'Đã hủy', bg: '#FBF3F3', border: '#FF8587', text: '#D20E18' },
  pending: { label: 'Chờ xử lý', bg: '#FFFFE2', border: '#F8BB54', text: '#F8BB54' },
};

const TABS: { key: BookingFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'paid-full', label: 'Đã thanh toán' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';

function StatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending'];
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function BookingCard({ booking }: { booking: BookingHistoryItem }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/profile/details?id=${booking.id}` as any)}>
      <View style={styles.cardTopRow}>
        <Text style={styles.orderCode} numberOfLines={1}>
          Mã đơn : {booking.id}
        </Text>
        <StatusBadge status={booking.status} />
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardInfoRows}>
        <Text style={styles.infoLine}>Tổng dịch vụ : x{booking.serviceCount}</Text>
        <Text style={styles.infoLine} numberOfLines={1}>Dịch vụ : {booking.service}</Text>
        <Text style={styles.infoLine}>
          Tổng số tiền dịch vụ:    {formatPrice(booking.amount)}
        </Text>
        <Text style={styles.infoLine}>Ngày đặt: {booking.date}</Text>
      </View>
    </Pressable>
  );
}

export default function BookingHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<BookingFilter>('all');
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.maKH) return;
      try {
        setLoading(true);
        const data = await userApi.getBookingHistory(user.maKH);
        // Lấy thêm chi tiết cho từng đơn để đếm số lượng dịch vụ thực tế vì API history không trả về serviceCount
        const detailedData = await Promise.all(
          data.map(async (item: any) => {
            try {
              const detailId = item.id || item.maLd || item.maHD || item.orderCode;
              if (detailId) {
                const detail = await userApi.getBookingDetail(detailId);
                return {
                  ...item,
                  serviceCount: detail?.items?.length || item.serviceCount,
                  items: detail?.items || item.items
                };
              }
            } catch (e) {
              console.log("Không lấy được chi tiết cho đơn", item.id);
            }
            return item;
          })
        );

        // Cố gắng map dữ liệu từ API về dạng BookingHistoryItem để tránh lỗi nếu API trả về field khác
        const mappedData = detailedData.map((item: any) => ({
          id: item.id || item.maLd || item.maHD || item.orderCode || Math.random().toString(),
          status: item.status || (item.trangThai === 0 ? 'cancelled' : item.trangThai === 1 ? 'pending' : item.trangThai === 2 ? 'paid-full' : 'completed'),
          serviceCount: item.serviceCount || (item.items ? item.items.length : 0),
          service: item.service || (item.items && item.items.length > 0 ? item.items[0].name : 'Dịch vụ'),
          amount: item.amount || item.finalAmount || item.tongTien || 0,
          date: item.date || item.orderDate || `${item.ngayHen ? item.ngayHen.split('T')[0] : ''} ${item.gioHen || ''}`.trim() || item.ngayTao || '',
        }));
        setBookings(mappedData.length > 0 ? mappedData : data);
      } catch (err) {
        console.error("Lỗi lấy lịch sử lịch hẹn", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user?.maKH]);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (activeTab !== 'all') {
      list = list.filter(b => b.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(b => b.id.toLowerCase().includes(q));
    }
    return list;
  }, [bookings, activeTab, searchQuery]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Feather name="chevron-left" size={28} color={COLORS.black} />
        </Pressable>
        <Text style={styles.headerTitle}>LỊCH ĐẶT CỦA TÔI</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color={COLORS.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm mã đơn"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.muted}
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.centeredContent}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.black} style={{ marginTop: scale(40) }} />
          ) : filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={scale(32)} color={COLORS.muted} />
              <Text style={styles.emptyText}>Không có lịch hẹn nào.</Text>
            </View>
          ) : (
            filteredBookings.map((b, i) => (
              <Animated.View key={b.id} entering={FadeInDown.delay(i * 50)}>
                <BookingCard booking={b} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FONT.labelRegular, fontSize: scale(16), letterSpacing: 2, color: COLORS.black },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: scale(16),
    marginTop: scale(16),
    marginBottom: scale(12),
    borderWidth: 1,
    borderColor: COLORS.searchBorder,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    height: scale(44),
    backgroundColor: COLORS.white,
  },
  searchIcon: { marginRight: scale(8) },
  searchInput: { flex: 1, fontFamily: FONT.body, fontSize: scale(14), color: COLORS.black },
  tabScroll: { paddingHorizontal: scale(16), paddingBottom: scale(8) },
  tabItem: { paddingVertical: scale(8), marginRight: scale(20), borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: COLORS.black },
  tabText: { fontFamily: FONT.body, fontSize: scale(14), color: COLORS.muted },
  tabTextActive: { color: COLORS.black, fontFamily: 'Inter_600SemiBold' },
  listContainer: { paddingHorizontal: scale(16), paddingBottom: scale(40), paddingTop: scale(12) },
  centeredContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  emptyState: { alignItems: 'center', marginTop: scale(40) },
  emptyText: { fontFamily: FONT.body, fontSize: scale(13), color: COLORS.muted, marginTop: scale(12) },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(16),
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) },
  orderCode: { fontFamily: FONT.labelBold, fontSize: scale(14), color: COLORS.black, flex: 1, marginRight: scale(8) },
  statusBadge: { paddingHorizontal: scale(10), paddingVertical: scale(4), borderRadius: scale(20), borderWidth: 1 },
  statusText: { fontFamily: FONT.body, fontSize: scale(11) },
  cardDivider: { height: 1, backgroundColor: '#E8E8E8', marginBottom: scale(12) },
  cardInfoRows: { gap: scale(8) },
  infoLine: { fontFamily: FONT.body, fontSize: scale(13), color: COLORS.muted },
});
