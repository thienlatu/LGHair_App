import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { getImageUrl } from '../src/utils/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const MAX_CONTENT_WIDTH = 480;
const clampedWidth = Math.min(SCREEN_WIDTH, MAX_CONTENT_WIDTH);
const scale = (size: number) => Math.round((clampedWidth / BASE_WIDTH) * size);

const COLORS = {
  muted: '#5C5C5C',
  imagePlaceholder: '#E8E8E8',
  black: '#000000',
  borderLighter: '#E1E1E1',
};

const FONT = {
  body: 'Inter_400Regular',
  labelRegular: 'Inconsolata_400Regular',
};

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';


interface ItemCardProps {
  image?: string;
  name: string;
  durationMinutes?: number;
  price: number;
  iconName?: keyof typeof Feather.glyphMap;
  onOptionsPress?: () => void;
}

export default function ItemCard({
  image,
  name,
  durationMinutes,
  price,
  iconName = 'trash-2',
  onOptionsPress,
}: ItemCardProps) {
  const isFontIcon = image && (image.startsWith('fas ') || image.startsWith('fa-'));
  const imgUrl = getImageUrl(image);

  return (
    <View style={styles.itemCard}>
      {!isFontIcon && (
        <View style={styles.itemThumbWrap}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.imagePlaceholder, justifyContent: 'center', alignItems: 'center' }]}>
            <Feather name="box" size={scale(20)} color={COLORS.muted} />
          </View>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.itemThumb} contentFit="cover" />
          ) : null}
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{name}</Text>
        {typeof durationMinutes === 'number' && (
          <Text style={styles.itemDuration}>{durationMinutes} phút</Text>
        )}
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>{formatPrice(price)}</Text>
        <Pressable onPress={onOptionsPress} hitSlop={10} style={styles.itemOptionsBtn}>
          <Feather name={iconName} size={scale(16)} color={COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLighter,
  },
  itemThumbWrap: {
    width: scale(50),
    height: scale(50),
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLighter,
    marginRight: scale(12),
  },
  itemThumb: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: FONT.body,
    fontSize: scale(14),
    color: COLORS.black,
    marginBottom: scale(4),
  },
  itemDuration: {
    fontFamily: FONT.body,
    fontSize: scale(12),
    color: COLORS.muted,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemPrice: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(14),
    color: COLORS.black,
    marginBottom: scale(8),
  },
  itemOptionsBtn: {
    padding: scale(4),
  },
});
