import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDataStore } from '../../src/stores/useDataStore';
import { useCheckoutStore } from '../../src/stores/useCheckoutStore';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import AlternatingServiceCard from '../../components/AlternatingServiceCard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export default function ServicesScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { CATEGORIES, SERVICES, isLoading, error, loadServices } = useDataStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { selectedServiceIds, setSelectedServiceIds } = useCheckoutStore();

  useEffect(() => {
    if (category) {
      setActiveCategory(category);
    }
  }, [category]);

  useEffect(() => {
    loadServices();
  }, []);
  const insets = useSafeAreaInsets();

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return SERVICES;
    return SERVICES.filter(s => s.maDm === activeCategory);
  }, [SERVICES, activeCategory]);

  const renderContent = () => {
    if (isLoading && SERVICES.length === 0) {
      return <LoadingState message="Đang tải danh sách dịch vụ..." />;
    }

    if (error && SERVICES.length === 0) {
      return <ErrorState message={error} onRetry={loadServices} />;
    }

    return (
      <>
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item.maDv}
          contentContainerStyle={[styles.listContainer, { paddingTop: insets.top + 65, paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadServices} tintColor={Colors.light.tint} />
          }
          ListEmptyComponent={() => (
            <EmptyState 
              title="Chưa có dịch vụ" 
              message="Danh mục này hiện chưa có dịch vụ, vui lòng quay lại sau." 
              iconName="cut-outline"
              onAction={loadServices}
              actionLabel="Tải lại"
            />
          )}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <Pressable 
                  style={[styles.categoryTab, activeCategory === 'all' && styles.categoryTabActive]}
                  onPress={() => setActiveCategory('all')}
                >
                  <Text style={[styles.categoryText, activeCategory === 'all' && styles.categoryTextActive]}>Tất cả</Text>
                </Pressable>
                
                {CATEGORIES.map(cat => (
                  <Pressable 
                    key={cat.maDM} 
                    style={[styles.categoryTab, activeCategory === cat.maDM && styles.categoryTabActive]}
                    onPress={() => setActiveCategory(cat.maDM)}
                  >
                    <Text style={[styles.categoryText, activeCategory === cat.maDM && styles.categoryTextActive]}>
                      {cat.tenDanhMuc}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(300 + index * 100).duration(800)}>
              <AlternatingServiceCard
                service={item}
                index={index}
                isAdded={selectedServiceIds.includes(item.maDv)}
                onPressAdd={(id) => {
                  setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                }}
                onPressDetail={(id) => router.push(`/service/${id}` as any)}
                onPressBook={(id) => router.push(`/booking?serviceId=${id}` as any)}
              />
            </Animated.View>
          )}
        />
        {selectedServiceIds.length > 0 && (
          <View style={styles.floatingPillContainer}>
            <Pressable 
              style={styles.floatingPill}
              onPress={() => {
                router.push('/booking');
              }}
            >
              <Text style={styles.pillTextLeft}>{selectedServiceIds.length} DỊCH VỤ</Text>
              <Text style={styles.pillTextRight}>Đặt ngay ➔</Text>
            </Pressable>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContainer: {
    paddingHorizontal: Theme.spacing.xl,
  },
  header: {
    marginBottom: Theme.spacing.xl,
    marginHorizontal: -Theme.spacing.xl,
  },
  categoryScroll: {
    paddingHorizontal: Theme.spacing.xl,
  },
  categoryTab: {
    paddingVertical: Theme.spacing.md,
    marginRight: Theme.spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: Colors.light.text,
  },
  categoryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.light.subText,
  },
  categoryTextActive: {
    color: Colors.light.text,
  },
  floatingPillContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingPill: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  pillTextLeft: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 2,
  },
  pillTextRight: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  }
});
