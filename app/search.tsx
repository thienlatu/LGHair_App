import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useDataStore } from '../src/stores/useDataStore';
import { removeAccents } from '../src/utils/stringUtils';
import AlternatingServiceCard from '../components/AlternatingServiceCard';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/ui/EmptyState';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { SERVICES, PRODUCTS, loadServices } = useDataStore();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    if (!query.trim()) {
      return [];
    }
    
    const normalizedQuery = removeAccents(query.toLowerCase().trim());

    const matchedServices = SERVICES.filter(s => 
      removeAccents(s.tenDv.toLowerCase()).includes(normalizedQuery)
    );

    const matchedProducts = PRODUCTS.filter(p => 
      removeAccents(p.tenSp.toLowerCase()).includes(normalizedQuery)
    );

    // Group products into chunks of 2 for 2-column grid
    const productRows = [];
    for (let i = 0; i < matchedProducts.length; i += 2) {
      productRows.push(matchedProducts.slice(i, i + 2));
    }

    const result = [];
    if (matchedServices.length > 0) {
      result.push({
        title: 'Dịch Vụ',
        data: matchedServices,
        type: 'service'
      });
    }
    if (productRows.length > 0) {
      result.push({
        title: 'Sản Phẩm',
        data: productRows,
        type: 'product'
      });
    }

    return result;
  }, [query, SERVICES, PRODUCTS]);

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item, section, index }: { item: any, section: any, index: number }) => {
    if (section.type === 'service') {
      return (
        <View style={styles.serviceWrapper}>
          <AlternatingServiceCard
            service={item}
            index={index}
            onPressDetail={(id) => router.push(`/service/${id}` as any)}
            onPressBook={(id) => router.push(`/booking?serviceId=${id}` as any)}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.productRow}>
          {item.map((prod: any, idx: number) => (
            <View key={(prod.maSp || prod.id || idx).toString() + '_' + idx} style={styles.productWrapper}>
              <ProductCard
                product={prod}
                onPress={(id) => router.push(`/product/${id}` as any)}
                cardWidth="100%"
              />
            </View>
          ))}
          {item.length === 1 && <View style={styles.productWrapper} />}
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.light.subText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dịch vụ, sản phẩm..."
            placeholderTextColor={Colors.light.subText}
            autoFocus={true}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearBtn}>
              <Feather name="x-circle" size={18} color={Colors.light.subText} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Hủy</Text>
        </Pressable>
      </View>

      {query.trim().length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => {
            const baseKey = item.maDv || item.maSp || (Array.isArray(item) ? item[0]?.maSp : null) || index;
            return `${baseKey}_${index}`;
          }}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ marginTop: 60 }}>
              <EmptyState 
                title="Không có kết quả" 
                message="Không tìm thấy sản phẩm/dịch vụ phù hợp với từ khóa của bạn." 
                iconName="search-outline"
                onAction={() => setQuery('')}
                actionLabel="Thử từ khóa khác"
              />
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyPrompt}>
          <Feather name="search" size={48} color={Colors.light.border} />
          <Text style={styles.emptyPromptText}>Nhập từ khóa để bắt đầu tìm kiếm</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: Theme.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.light.text,
  },
  clearBtn: {
    padding: Theme.spacing.xs,
  },
  cancelBtn: {
    paddingLeft: Theme.spacing.md,
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.light.text,
  },
  listContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
  },
  sectionHeader: {
    paddingVertical: Theme.spacing.md,
    backgroundColor: Colors.light.background,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  serviceWrapper: {
    marginBottom: Theme.spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  productWrapper: {
    width: '48%',
  },
  emptyPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyPromptText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.light.subText,
    marginTop: Theme.spacing.md,
  }
});
