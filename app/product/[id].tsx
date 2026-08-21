import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import PrimaryButton from '../../components/PrimaryButton';
import apiClient, { API_BASE_URL } from '../../src/services/apiClient';
import { ProductDetail, BienTheSanPham } from '../../src/types';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useCartStore } from '../../src/stores/useCartStore';
import { Alert } from 'react-native';
import AppToast from '../../components/ui/AppToast';
import ErrorState from '../../components/ui/ErrorState';
import { getImageUrl } from '../../src/utils/imageUtils';
import { useDataStore } from '../../src/stores/useDataStore';

const { width } = Dimensions.get('window');


export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBienThe, setSelectedBienThe] = useState<BienTheSanPham | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'usage'>('details');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { addVariant, isLoading: isAddingToCart, totalItems } = useCartStore();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<"success" | "error" | "warning" | "info">("info");

  const showToast = (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalizedId = Array.isArray(id) ? id[0] : id;
      let targetMaSp = normalizedId;
      
      const { PRODUCTS } = useDataStore.getState();
      if (PRODUCTS && PRODUCTS.length > 0) {
        const foundProduct = PRODUCTS.find(p => p.maBienThe === normalizedId || p.maSp === normalizedId);
        if (foundProduct && foundProduct.maSp) {
          targetMaSp = foundProduct.maSp;
        }
      }

      const response = await apiClient.get(`/api/SanPham/${targetMaSp}`);
      setProduct(response.data);
      if (response.data.bienThes && response.data.bienThes.length > 0) {
        const targetBienThe = response.data.bienThes.find((bt: any) => bt.maBienThe === normalizedId);
        if (targetBienThe) {
          setSelectedBienThe(targetBienThe);
        } else {
          setSelectedBienThe(response.data.bienThes[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching product detail:', error);
      if (error.message === 'Network Error') {
        setError('Không có kết nối mạng. Vui lòng kiểm tra lại đường truyền.');
      } else {
        setError(error.response?.data?.message || 'Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.light.text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState message={error} onRetry={fetchProduct} />
        <PrimaryButton title="Quay Lại" onPress={() => router.back()} style={{ marginHorizontal: 20, marginBottom: 20 }} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingHorizontal: Theme.spacing.xl }]}>
        <Text style={styles.name}>Không tìm thấy sản phẩm</Text>
        <PrimaryButton title="Quay Lại" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const displayPrice = selectedBienThe
    ? `${selectedBienThe.giaBan.toLocaleString('vi-VN')}đ`
    : product.giaTu === product.giaDen || !product.giaDen
      ? product.giaTu ? `${product.giaTu.toLocaleString('vi-VN')}đ` : 'Giá liên hệ'
      : `${product.giaTu?.toLocaleString('vi-VN')}đ - ${product.giaDen?.toLocaleString('vi-VN')}đ`;

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    if (!selectedBienThe) {
      showToast('Vui lòng chọn một tùy chọn/biến thể của sản phẩm!', 'warning');
      return;
    }
    
    try {
      await addVariant(selectedBienThe.maBienThe, 1);
      showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
    } catch (error: any) {
      showToast(`Lỗi khi thêm: ${error.response?.data?.message || error.message || JSON.stringify(error)}`, 'error');
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để mua hàng.",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    if (!selectedBienThe) {
      showToast('Vui lòng chọn một tùy chọn/biến thể của sản phẩm!', 'warning');
      return;
    }
    
    try {
      await addVariant(selectedBienThe.maBienThe, 1);
      router.push('/cart');
    } catch (error: any) {
      showToast(`Lỗi khi mua hàng: ${error.response?.data?.message || error.message || JSON.stringify(error)}`, 'error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { top: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={Colors.light.text} />
        </Pressable>
        <Pressable onPress={() => router.push('/cart')} style={styles.backBtn}>
          <View>
            <Feather name="shopping-bag" size={24} color={Colors.light.text} />
            {totalItems > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {totalItems > 99 ? '99+' : totalItems}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.imageContainer}>
          <Image
            source={getImageUrl(selectedBienThe?.hinhAnhDaiDien || product.hinhAnhDaiDien)}
            style={styles.image}
            contentFit="cover"
            transition={500}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{product.danhMuc?.tenDanhMuc}</Text>
          <Text style={styles.name}>{product.tenSp}</Text>
          <Text style={styles.price}>{displayPrice}</Text>

          <View style={styles.divider} />

          {product.bienThes && product.bienThes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>TÙY CHỌN sản phẩm</Text>
              <View style={styles.variantContainer}>
                {product.bienThes.map(bt => (
                  <Pressable
                    key={bt.maBienThe}
                    style={[
                      styles.variantBtn,
                      selectedBienThe?.maBienThe === bt.maBienThe && styles.variantBtnActive
                    ]}
                    onPress={() => setSelectedBienThe(bt)}
                  >
                    <Text style={[
                      styles.variantText,
                      selectedBienThe?.maBienThe === bt.maBienThe && styles.variantTextActive
                    ]}>
                      {bt.tenBienThe}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.divider} />
            </>
          )}

          {product.huongDanSuDung ? (
            <>
              <Text style={styles.sectionTitle}>HƯỚNG DẪN SỬ DỤNG</Text>
              <Text style={styles.desc}>{product.huongDanSuDung}</Text>
              <View style={styles.divider} />
            </>
          ) : null}

          <View style={styles.tabHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable onPress={() => setActiveTab('details')} style={[styles.tabBtn, activeTab === 'details' && styles.tabBtnActive]}>
                <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>CHI TIẾT</Text>
              </Pressable>
              {product.thanhPhan ? (
                <Pressable onPress={() => setActiveTab('ingredients')} style={[styles.tabBtn, activeTab === 'ingredients' && styles.tabBtnActive]}>
                  <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>THÀNH PHẦN</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'details' && product.moTa && <Text style={styles.desc}>{product.moTa}</Text>}
            {activeTab === 'ingredients' && product.thanhPhan && <Text style={styles.desc}>{product.thanhPhan}</Text>}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Theme.spacing.md) }]}>
        <PrimaryButton
          title={isAddingToCart ? "ĐANG THÊM..." : "THÊM VÀO GIỎ HÀNG"}
          variant="outline"
          onPress={handleAddToCart}
          style={[styles.actionBtn, { marginRight: Theme.spacing.sm }]}
          textStyle={styles.btnText}
          disabled={isAddingToCart}
        />
        <PrimaryButton
          title="MUA NGAY"
          variant="primary"
          onPress={handleBuyNow}
          style={styles.actionBtn}
          textStyle={styles.btnText}
          disabled={isAddingToCart}
        />
      </View>
      <AppToast visible={toastVisible} message={toastMessage} type={toastType} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    height: 60,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: {
    padding: Theme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
  },
  imageContainer: {
    width: width,
    height: width * 1.25,
    backgroundColor: '#f4f4f4',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxxl,
  },
  category: {
    ...Theme.typography.subtitle,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.md,
  },
  name: {
    ...Theme.typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.light.text,
    marginBottom: Theme.spacing.lg,
  },
  price: {
    fontFamily: 'Inter_300Light',
    fontSize: 20,
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Theme.spacing.xl,
  },
  sectionTitle: {
    ...Theme.typography.subtitle,
    color: Colors.light.text,
    marginBottom: Theme.spacing.md,
  },
  desc: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.lg,
  },
  variantContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  variantBtn: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
  },
  variantBtnActive: {
    borderColor: Colors.light.text,
    backgroundColor: Colors.light.text,
  },
  variantText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.light.text,
  },
  variantTextActive: {
    color: Colors.light.background,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    padding: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 14,
  },
  btnText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: Theme.spacing.lg,
  },
  tabBtn: {
    paddingVertical: Theme.spacing.md,
    marginRight: Theme.spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1, // overlap the borderBottom of tabHeader
  },
  tabBtnActive: {
    borderBottomColor: Colors.light.text,
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    letterSpacing: 1,
    color: Colors.light.subText,
  },
  tabTextActive: {
    color: Colors.light.text,
  },
  tabContent: {
    minHeight: 100,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    fontSize: 9
  }
});
