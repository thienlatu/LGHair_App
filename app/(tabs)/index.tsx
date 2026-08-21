import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, FlatList, NativeSyntheticEvent, NativeScrollEvent, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../src/stores/useDataStore';
import { useScrollStore } from '../../src/stores/useScrollStore';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import PrimaryButton from '../../components/PrimaryButton';
import AlternatingServiceCard from '../../components/AlternatingServiceCard';
import ProductCard from '../../components/ProductCard';
import { StatusBar } from 'expo-status-bar';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { getImageUrl } from '../../src/utils/imageUtils';


const { height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { PRODUCTS, SERVICES, CATEGORIES, loadServices, error, isLoading } = useDataStore();
  const setTabBarVisible = useScrollStore((state) => state.setTabBarVisible);
  const scrollOffset = useRef(0);

  useEffect(() => {
    loadServices();
  }, []);

  // Hỗ trợ hiển thị lỗi khi đang dùng dữ liệu cache cũ
  useEffect(() => {
    if (error && CATEGORIES.length > 0) {
      Alert.alert(
        "Lỗi đồng bộ",
        "Không thể làm mới dữ liệu do lỗi kết nối mạng. Ứng dụng đang hiển thị dữ liệu lưu tạm.",
        [{ text: "Đã hiểu", style: "default" }]
      );
    }
  }, [error]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const dif = currentOffset - scrollOffset.current;

    if (dif < 0 && currentOffset > 0) {
      setTabBarVisible(true); // Scrolling up
    } else if (dif > 0 && currentOffset > 100) {
      setTabBarVisible(false); // Scrolling down
    }
    scrollOffset.current = currentOffset;
  };

  const { width } = Dimensions.get('window');
  const bannerWidth = Math.max(1, width - 32);
  const [activeBanner, setActiveBanner] = React.useState(0);

  // Mảng chứa hình và chữ
  const bannerImages = [
    {
      uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1400',
      title: 'BỘ SƯU TẬP MỚI',
      subtitle: 'Khám phá ngay xu hướng'
    },
    {
      uri: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1400',
      title: 'DỊCH VỤ ĐẲNG CẤP',
      subtitle: 'Trải nghiệm sự khác biệt'
    },
    {
      uri: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=1400',
      title: 'PHONG CÁCH TỐI GIẢN',
      subtitle: 'Tôn vinh vẻ đẹp tự nhiên'
    }
  ];

  const onBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / bannerWidth);
    if (slide !== activeBanner) {
      setActiveBanner(slide);
    }
  };

  if (isLoading && CATEGORIES.length === 0) {
    return <LoadingState message="Đang tải dữ liệu trang chủ..." />;
  }

  if (error && CATEGORIES.length === 0) {
    return <ErrorState message={error} onRetry={loadServices} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadServices} tintColor={Colors.light.tint} />
        }
        contentContainerStyle={{
          paddingTop: insets.top + 60, // Account for header height
          paddingBottom: 100
        }}
      >
        {/* Banner Section */}
        <View style={styles.bannerSection}>
          <FlatList
            data={bannerImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onBannerScroll}
            scrollEventThrottle={16}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ width: bannerWidth, alignItems: 'center', position: 'relative' }}>
                <Image 
                  source={{ uri: item.uri }} 
                  style={styles.bannerImage} 
                  contentFit="cover" 
                  transition={500} 
                />
                
                {/* Lớp phủ Text viết thẳng lên hình với textShadow */}
                <View style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 16,
                }}>
                  <Text style={{ 
                    color: '#FFFFFF', 
                    fontSize: 22, 
                    fontFamily: 'Inter_600SemiBold',
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: -1, height: 1 },
                    textShadowRadius: 10
                  }}>
                    {item.title}
                  </Text>
                  <Text style={{ 
                    color: '#E0E0E0', 
                    fontSize: 14, 
                    fontFamily: 'Inter_400Regular', 
                    marginTop: 4,
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: -1, height: 1 },
                    textShadowRadius: 10
                  }}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            )}
          />
          <View style={styles.pagination}>
            {bannerImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activeBanner && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Category Grid */}
        <View style={styles.categorySection}>
          <View style={{ paddingHorizontal: 22 }}>
            <Text style={styles.categoryHorizontalTitle}>Bạn đang cần gì ?</Text>
          </View>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 22 }}
            ItemSeparatorComponent={() => <View style={{ width: 18 }} />}
            keyExtractor={(item, index) => item.maDm?.toString() || index.toString()}
            renderItem={({ item }) => (
              <Pressable style={styles.categoryItem} onPress={() => {
                const catId = item.maDm;
                router.navigate({ pathname: '/(tabs)/services', params: { category: catId } });
              }}>
                <View style={styles.categoryImageContainer}>
                  {item.hinhAnh ? (
                    <Image source={{ uri: getImageUrl(`${item.hinhAnh}`) }} style={styles.categoryImage} contentFit="cover" transition={300} />
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#d9d9d9' }} />
                  )}
                </View>
                <View style={styles.categoryTextContainer}>
                  <Text style={styles.categoryItemText} numberOfLines={2}>
                    {item.tenDanhMuc}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Featured Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Animated.Text entering={FadeInDown.duration(800)} style={styles.sectionTitleNew}>
                DỊCH VỤ NỔI BẬT
              </Animated.Text>
              <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.titleUnderline} />
            </View>
          </View>

          <View style={styles.serviceList}>
            {SERVICES.slice(0, 2).map((service, index) => (
              <Animated.View key={service.maDv} entering={FadeInDown.delay(300 + index * 200).duration(800)}>
                <AlternatingServiceCard
                  service={service}
                  index={index}
                  onPressDetail={(id) => router.push(`/service/${id}` as any)}
                  onPressBook={(id) => router.push(`/booking?serviceId=${id}` as any)}
                />
              </Animated.View>
            ))}
          </View>

          <Pressable onPress={() => router.push('/services')} style={styles.luxuryOutlineBtn}>
            <Text style={styles.luxuryBtnTextDark}>XEM TẤT CẢ DỊCH VỤ</Text>
          </Pressable>
        </View>

        {/* Editorial Banner */}
        <View style={styles.editorialSection}>
          <Text style={styles.sectionSubtitleDark}>TRIẾT LÝ THIẾT KẾ</Text>
          <Text style={styles.editorialTitleMain}>NƠI KỸ THUẬT HOÀN HẢO</Text>
          <Text style={styles.editorialItalic}>giao thoa cùng</Text>
          <Text style={styles.editorialTitleMainBottom}>TẦM NHÌN NGHỆ THUẬT</Text>
          <Pressable onPress={() => router.push('/booking')} style={styles.editorialBtnNew}>
            <Text style={styles.editorialBtnText}>ĐẶT LỊCH TƯ VẤN</Text>
          </Pressable>
        </View>

        {/* Featured Products */}
        <View style={styles.sectionNoPadding}>
          <View style={styles.productSectionHeader}>
            <Text style={styles.productSectionTitle}>SẢN PHẨM TINH HOA</Text>
            <View style={styles.productTitleUnderline} />
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={PRODUCTS.slice(0, 6)}
            keyExtractor={(item, index) => `product_${index}`}
            contentContainerStyle={{ paddingHorizontal: Theme.spacing.xl }}
            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 100).duration(800)}>
                <ProductCard
                  product={item}
                  onPress={(id) => router.push(`/product/${id}` as any)}
                  cardWidth={Dimensions.get('window').width * 0.70}
                />
              </Animated.View>
            )}
          />

          <Pressable onPress={() => router.navigate('/(tabs)/shop')} style={styles.luxurySolidBtn}>
            <Text style={styles.luxuryBtnTextLight}>KHÁM PHÁ BỘ SƯU TẬP</Text>
          </Pressable>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  bannerSection: {
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.lg,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  bannerImage: {
    width: '100%',
    height: 155, // Fixed height based on design ratio
    borderRadius: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#333',
  },
  categorySection: {
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
  },
  categoryHorizontalTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#000',
    marginBottom: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 55,
  },
  categoryImageContainer: {
    width: 55, // Khuôn chứa hình 55x54
    height: 54,
    borderRadius: 12,
    backgroundColor: '#d9d9d9', // Màu xám mặc định như hình nếu chưa có ảnh
    marginBottom: 6,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryTextContainer: {
    width: 54, // Khuôn chứa chữ 54x26
    height: 26,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  categoryItemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11, // Size chữ 11
    color: '#000',
    textAlign: 'center',
    lineHeight: 13,
  },
  section: {
    paddingHorizontal: 22,
    paddingTop: 2,
    paddingBottom: 24,
  },
  sectionNoPadding: {
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  sectionTitleNew: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#000',
  },
  titleUnderline: {
    width: 112,
    height: 1,
    backgroundColor: '#ff4d4f', // Red underline as in the template
    marginTop: 6, // Đúng 6px từ text
    borderRadius: 2,
  },
  viewAllText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  viewAllBottom: {
    alignItems: 'center',
    marginTop: 0,
  },
  viewAllTextBottom: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
  serviceList: {
    marginBottom: 27, // Đúng 27px từ hình cuối đến Xem tất cả
  },

  // =============== BẮT ĐẦU FIX PHẦN EDITORIAL ===============
  editorialSection: {
    width: '100%',
    height: 232, // Fix cứng chiều cao theo đúng chuẩn Figma
    backgroundColor: '#070000',
    alignItems: 'center',
    paddingTop: 24, // Tương đương Y: 893 - Y: 869
    marginTop: 24,
  },
  sectionSubtitleDark: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 10,
    lineHeight: 10,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 30, // Tương đương khoảng cách Y: 933 - 903
  },
  editorialTitleMain: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 20,
    lineHeight: 21,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  editorialItalic: {
    fontFamily: 'JosefinSlab_400Regular',
    fontSize: 15,
    lineHeight: 15,
    color: '#FFFFFF',
    marginTop: 10, // Y: 964 - 954
    marginBottom: 10, // Y: 989 - 979
  },
  editorialTitleMainBottom: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 20,
    lineHeight: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 31, // Khoảng cách chuẩn đến nút Đặt lịch: Y: 1041 - 1010
  },
  editorialBtnNew: {
    backgroundColor: '#FFFFFF',
    width: 96,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  editorialBtnText: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 10,
    color: '#000000',
  },
  // =============== KẾT THÚC FIX PHẦN EDITORIAL ===============

  productSectionHeader: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: 16,
  },
  productSectionTitle: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
  },
  productTitleUnderline: {
    width: 126, // Exact 126px width
    height: 1, // Red underline
    backgroundColor: '#ff4d4f',
    marginTop: 4,
  },
  productViewAllContainer: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  productViewAllText: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
  },
  productViewAllUnderline: {
    width: 80, // Exact 80px width
    height: 1,
    backgroundColor: '#000', // Black underline
    marginTop: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
  },
  luxuryOutlineBtn: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginTop: 10,
  },
  luxurySolidBtn: {
    backgroundColor: '#070000',
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginTop: 2,
  },
  luxuryBtnTextDark: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#000',
    letterSpacing: 2.5,
  },
  luxuryBtnTextLight: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#FFF',
    letterSpacing: 2.5,
  },
});