import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDataStore } from '../../src/stores/useDataStore';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import LoadingState from '../../components/ui/LoadingState';

export default function ShopScreen() {
  const router = useRouter();
  const { PRODUCTS, loadServices, isLoading, error } = useDataStore();
  const insets = useSafeAreaInsets();

  if (isLoading && PRODUCTS.length === 0) {
    return <LoadingState message="Đang tải danh sách sản phẩm..." />;
  }

  if (error && PRODUCTS.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 65 }]}>
        <ErrorState message={error} onRetry={loadServices} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <FlatList
        data={PRODUCTS}
        keyExtractor={(item, index) => `shop_prod_${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + 65, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadServices} tintColor={Colors.light.tint} />
        }
        ListEmptyComponent={() => (
          <EmptyState 
            title="Chưa có sản phẩm" 
            message="Cửa hàng hiện chưa có sản phẩm nào." 
            iconName="cube-outline"
            onAction={loadServices}
            actionLabel="Tải lại"
          />
        )}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onPress={(id) => router.push(`/product/${id}` as any)} 
          />
        )}
      />
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
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    padding: Theme.spacing.sm,
    width: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 16,
    letterSpacing: 4,
    color: Colors.light.text,
  },
  listContainer: {
    padding: Theme.spacing.xl,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },

});
