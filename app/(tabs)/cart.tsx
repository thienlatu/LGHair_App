import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useCartStore } from '../../src/stores/useCartStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { API_BASE_URL } from '../../src/services/apiClient';

const getImageUrl = (path?: string) => {
  if (!path || path === 'null' || path === 'undefined' || path.trim() === '') return undefined;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { items, totalItems, totalPrice, isLoading, fetchCart, updateQuantity, removeItem } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchCart();
      }
    }, [isAuthenticated])
  );

  const formatPrice = (price: number) => Math.round(price).toLocaleString('vi-VN') + 'đ';

  const handleUpdateQty = (id: string, loai: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    updateQuantity(id, loai, newQty);
  };

  const handleRemove = (id: string, loai: string) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: () => removeItem(id, loai) }
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 80, alignItems: 'center', paddingHorizontal: Theme.spacing.xl }]}>
        <Feather name="lock" size={64} color={Colors.light.border} style={{ marginBottom: 20 }} />
        <Text style={styles.subtitle}>GIỎ HÀNG</Text>
        <Text style={styles.desc}>Bạn cần đăng nhập để xem giỏ hàng.</Text>
        <PrimaryButton title="ĐĂNG NHẬP NGAY" onPress={() => router.push('/login')} style={{ width: '100%', marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 80, paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >

        {isLoading && items.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.light.text} style={{ marginTop: 50 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.desc}>Giỏ hàng của bạn đang trống.</Text>
            <PrimaryButton
              title="Tiếp Tục Mua Sắm"
              onPress={() => router.push('/shop')}
              variant="outline"
              style={styles.btn}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => {
              const imgUrl = getImageUrl(item.hinhAnh);
              return (
                <Pressable 
                  key={`${item.id}-${item.loai}-${index}`} 
                  style={styles.cartItem}
                  onPress={() => {
                    if (item.loai === 'DICHVU' || item.loai === 'COMBO') {
                      router.push(`/service/${item.id}` as any);
                    } else {
                      router.push(`/product/${(item as any).maSp || item.id}` as any);
                    }
                  }}
                >
                  <View style={styles.itemImageWrap}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.light.border, justifyContent: 'center', alignItems: 'center', borderRadius: 8 }]}>
                      <Feather name="box" size={24} color={Colors.light.subText} />
                    </View>
                    {imgUrl && <Image source={{ uri: imgUrl }} style={styles.itemImage} contentFit="cover" />}
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.itemType}>{item.loai === 'BIENTHE' ? 'Sản phẩm' : item.loai === 'DICHVU' ? 'Dịch vụ' : 'Combo'}</Text>
                    <Text style={styles.itemName} numberOfLines={2}>{item.ten}</Text>
                    <Text style={styles.itemPrice}>{formatPrice(item.gia)}</Text>
                  </View>

                  <View style={styles.actions}>
                    <Pressable onPress={() => handleRemove(item.id, item.loai)} style={styles.removeBtn}>
                      <Feather name="trash-2" size={18} color={Colors.light.subText} />
                    </Pressable>
                    <View style={styles.qtyControls}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQty(item.id, item.loai, item.soLuong, -1)}
                        disabled={isLoading}
                      >
                        <Feather name="minus" size={16} color={Colors.light.text} />
                      </Pressable>
                      <Text style={styles.qtyText}>{item.soLuong}</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => handleUpdateQty(item.id, item.loai, item.soLuong, 1)}
                        disabled={isLoading}
                      >
                        <Feather name="plus" size={16} color={Colors.light.text} />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>TỔNG TẠM TÍNH</Text>
            <Text style={styles.totalAmount}>{formatPrice(totalPrice)}</Text>
          </View>
          <PrimaryButton
            title="TIẾP TỤC"
            onPress={() => router.push('/booking')}
            disabled={isLoading}
            style={styles.continueBtn}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Theme.spacing.xl,
  },
  subtitle: {
    ...Theme.typography.subtitle,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.md,
  },
  title: {
    ...Theme.typography.h1,
    color: Colors.light.text,
    marginBottom: Theme.spacing.xxl,
  },
  emptyContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Theme.spacing.xxl,
    alignItems: 'center',
  },
  desc: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.xxxl,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
  },
  list: {
    gap: Theme.spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  itemImageWrap: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: Theme.spacing.md,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemType: {
    fontFamily: 'Inconsolata_500Medium',
    fontSize: 11,
    color: Colors.light.subText,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  itemPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  removeBtn: {
    padding: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 4,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    minWidth: 24,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 65,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 14,
    color: Colors.light.text,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  totalAmount: {
    fontFamily: 'Inconsolata_400Regular',
    fontSize: 20,
    color: Colors.light.text,
  },
  continueBtn: {
    width: 140,
    height: 44,
    borderRadius: 0,
  }
});
