import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import ItemCard from './ItemCard';
import { BookingServiceItem } from '../src/services/bookingApi';
import { ProductListItem } from '../src/types';

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
  borderLight: '#D9D9D9',
};

const FONT = {
  body: 'Inter_400Regular',
};

interface SearchModalProps {
  visible: boolean;
  searchMode: 'service' | 'product' | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
  filteredSearchResults: any[];
  onSelectSearchResult: (item: any) => void;
  getServiceImage: (svc: BookingServiceItem) => string;
}

export default function SearchModal({
  visible,
  searchMode,
  searchQuery,
  setSearchQuery,
  onClose,
  filteredSearchResults,
  onSelectSearchResult,
  getServiceImage,
}: SearchModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={{ padding: scale(8) }}>
            <Feather name="x" size={scale(24)} color={COLORS.black} />
          </Pressable>
          <TextInput
            style={styles.modalInput}
            placeholder={searchMode === 'service' ? "Tìm kiếm dịch vụ..." : "Tìm kiếm sản phẩm..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        <FlatList
          data={filteredSearchResults}
          keyExtractor={(item: any, index) => String(searchMode === 'service' ? item.id : (item.maBienThe || item.maSp || 'search')) + '_' + index}
          contentContainerStyle={{ padding: scale(16), gap: scale(12) }}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptySearchText}>Không tìm thấy kết quả phù hợp.</Text>
            ) : (
              <Text style={styles.emptySearchText}>Nhập tên để tìm kiếm...</Text>
            )
          }
          renderItem={({ item }) => {
            if (searchMode === 'service') {
              const svc = item as BookingServiceItem;
              return (
                <ItemCard
                  name={svc.name}
                  price={svc.price}
                  durationMinutes={svc.duration}
                  image={getServiceImage(svc)}
                  iconName="plus"
                  onOptionsPress={() => onSelectSearchResult(svc)}
                />
              );
            } else {
              const prd = item as ProductListItem;
              return (
                <ItemCard
                  name={prd.tenSp}
                  price={prd.giaBan || prd.giaTu || 0}
                  image={prd.hinhAnhDaiDien}
                  iconName="shopping-cart"
                  onOptionsPress={() => onSelectSearchResult(prd)}
                />
              );
            }
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  modalInput: {
    flex: 1,
    height: scale(40),
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    paddingHorizontal: scale(12),
    marginLeft: scale(8),
    fontFamily: FONT.body,
    fontSize: scale(15),
    color: COLORS.black,
  },
  emptySearchText: {
    fontFamily: FONT.body,
    fontSize: scale(15),
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: scale(32),
  },
});
