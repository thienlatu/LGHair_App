import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDataStore } from '../../src/stores/useDataStore';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import ProductCard from '../../components/ProductCard';

export default function ShopScreen() {
  const router = useRouter();
  const { PRODUCTS } = useDataStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>

      
      <FlatList
        data={PRODUCTS}
        keyExtractor={(item, index) => `shop_prod_${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + 80, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
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
