import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import PrimaryButton from '../../components/PrimaryButton';
import apiClient, { API_BASE_URL } from '../../src/services/apiClient';
import { ServiceDetail } from '../../src/types';

const { width } = Dimensions.get('window');

const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!service || !service.images || service.images.length <= 1 || !isAutoScrolling) return;
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % service.images.length;
      flatListRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [service, isAutoScrolling]);

  const fetchService = async () => {
    setLoading(true);
    setError(null);
    const normalizedId = Array.isArray(id) ? id[0] : id;
    
    if (!normalizedId) {
      setError('ID dịch vụ không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.get(`/api/Services/${normalizedId}`);
      setService(res.data);
    } catch (err) {
      console.error("Failed to fetch service detail", err);
      setError("Không thể tải thông tin dịch vụ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }, styles.ph24]}>
        <Feather name="wifi-off" size={64} color={Colors.light.subText} style={styles.mb16} />
        <Text style={[Theme.typography.h3, styles.textCenter, styles.mb8, { color: Colors.light.text }]}>Đã có lỗi xảy ra</Text>
        <Text style={[Theme.typography.body, styles.textCenter, styles.mb24, { color: Colors.light.subText }]}>{error}</Text>
        <PrimaryButton title="Thử lại" onPress={fetchService} style={styles.w100} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text>Không tìm thấy dịch vụ</Text>
        <PrimaryButton title="Quay lại" onPress={() => router.back()} style={styles.mt20} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { top: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.light.background} />
        </Pressable>
      </View>

      <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {service.images && service.images.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={service.images}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScrollBeginDrag={() => setIsAutoScrolling(false)}
              onScrollEndDrag={() => setIsAutoScrolling(true)}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                indexRef.current = newIndex;
              }}
              renderItem={({ item }) => (
                <Image
                  source={getImageUrl(item)}
                  style={styles.image}
                  contentFit="cover"
                  transition={500}
                />
              )}
            />
          ) : (
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.image}
              contentFit="contain"
            />
          )}
          <View style={styles.overlay} />
        </View>

        <View style={styles.content}>
          <Text style={styles.name}>{service.tenDv}</Text>
          <View style={styles.metaRow}>
            {service.phanTramGiam ? (
              <Text style={styles.price}>
                {service.gia.toLocaleString('vi-VN')}đ{' '}
                <Text style={styles.originalPrice}>({service.giaGoc.toLocaleString('vi-VN')}đ)</Text>
              </Text>
            ) : (
              <Text style={styles.price}>{service.gia.toLocaleString('vi-VN')}đ</Text>
            )}
            <View style={styles.dot} />
            <Text style={styles.duration}>{service.thoiGianLam} PHÚT</Text>
          </View>

          <Text style={styles.desc}>{service.moTa}</Text>

          <View style={styles.divider} />

          {/* Quy trình / Tiêu đề dịch vụ */}
          {service.tieudeDichvus && service.tieudeDichvus.map((td) => (
            <View key={td.maTd} style={styles.section}>
              <Text style={styles.sectionTitle}>{td.tenTieuDe.toUpperCase()}</Text>
              {td.moTaTieuDe && <Text style={styles.desc}>{td.moTaTieuDe}</Text>}

              {td.chiTiet && td.chiTiet.map((ct, idx) => (
                <View key={ct.maCttd} style={styles.stepRow}>
                  <Text style={styles.stepNumber}>0{idx + 1}</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepText}>{ct.tenTieuDe}</Text>
                    {ct.moTaTieuDe && <Text style={styles.stepDesc}>{ct.moTaTieuDe}</Text>}
                  </View>
                </View>
              ))}
              <View style={styles.divider} />
            </View>
          ))}

          {/* Các kiểu tóc */}
          {service.kieuTocs && service.kieuTocs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>KIỂU TÓC THAM KHẢO</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hScroll}
                contentContainerStyle={styles.hScrollContent}
                data={service.kieuTocs}
                keyExtractor={(kt) => kt.maKt.toString()}
                renderItem={({ item: kt }) => (
                  <View style={styles.hairStyleCard}>
                    <Image source={getImageUrl(kt.hinhAnh)} style={styles.hairStyleImg} contentFit="cover" />
                    <Text style={styles.hairStyleName}>{kt.tenKieuToc}</Text>
                  </View>
                )}
              />
              <View style={styles.divider} />
            </View>
          )}

          {/* Có thể bạn sẽ thích (Suggested Services) */}
          {service.suggestedServices && service.suggestedServices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CÓ THỂ BẠN SẼ THÍCH</Text>
              {service.suggestedServices.map((sg) => (
                <Pressable key={sg.id} style={styles.suggestedCard} onPress={() => router.push(`/service/${sg.id}`)}>
                  <Image source={getImageUrl(sg.hinhAnh)} style={styles.suggestedImg} contentFit="cover" />
                  <View style={styles.suggestedInfo}>
                    <Text style={styles.suggestedName}>{sg.tenDv}</Text>
                    <Text style={styles.suggestedPrice}>{sg.gia.toLocaleString('vi-VN')}đ</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Theme.spacing.xl) }]}>
        <PrimaryButton
          title="Đặt Lịch Ngay"
          onPress={() => router.push('/booking')}
          style={styles.bookBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    height: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    marginLeft: 8,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#000',
  },
  image: {
    width: width,
    height: '100%',
  },
  paginationBadge: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 5,
  },
  paginationText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    padding: Theme.spacing.xl,
    paddingTop: 32,
    marginTop: -40,
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: 1,
    color: Colors.light.text,
    marginBottom: Theme.spacing.md,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  price: {
    fontFamily: 'Inter_300Light',
    fontSize: 16,
    color: Colors.light.text,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: Colors.light.subText,
    fontSize: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.text,
    marginHorizontal: Theme.spacing.lg,
  },
  duration: {
    ...Theme.typography.subtitle,
    color: Colors.light.subText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Theme.spacing.xl,
  },
  section: {
    marginBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Theme.typography.subtitle,
    color: Colors.light.text,
    marginBottom: Theme.spacing.md,
  },
  desc: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  stepNumber: {
    ...Theme.typography.subtitle,
    color: Colors.light.subText,
    marginRight: Theme.spacing.lg,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    ...Theme.typography.body,
    color: Colors.light.text,
  },
  stepDesc: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    fontSize: 13,
    marginTop: 4,
  },
  flex1: { flex: 1 },
  w100: { width: '100%' },
  mt20: { marginTop: 20 },
  mb16: { marginBottom: 16 },
  mb8: { marginBottom: 8 },
  mb24: { marginBottom: 24 },
  ph24: { paddingHorizontal: 24 },
  textCenter: { textAlign: 'center' },
  hScroll: {
    marginHorizontal: -Theme.spacing.xl,
  },
  hScrollContent: {
    paddingHorizontal: Theme.spacing.xl,
  },
  hairStyleCard: {
    marginRight: Theme.spacing.md,
    width: width * 0.4,
  },
  hairStyleImg: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  hairStyleName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.light.text,
  },
  suggestedCard: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.md,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestedImg: {
    width: 80,
    height: 80,
  },
  suggestedInfo: {
    padding: Theme.spacing.md,
    justifyContent: 'center',
  },
  suggestedName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 4,
  },
  suggestedPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
  },
  bottomBar: {
    backgroundColor: Colors.light.background,
    padding: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  bookBtn: {
    width: '100%',
  }
});
