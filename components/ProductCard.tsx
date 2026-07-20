import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { ProductListItem } from '../src/types';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { API_BASE_URL } from '../src/services/apiClient';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Theme.spacing.xl * 2 - Theme.spacing.md) / 2;

const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
};

interface ProductCardProps {
  product: ProductListItem;
  onPress: (id: string) => void;
  cardWidth?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ProductCard({ product, onPress, cardWidth }: ProductCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => { scale.value = withTiming(0.97, { duration: 150 }); };
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      style={[styles.container, cardWidth ? { width: cardWidth } : null, animatedStyle]}
      onPress={() => onPress(product.maSp)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.imageContainer}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.light.border, justifyContent: 'center', alignItems: 'center' }]}>
          <Feather name="box" size={32} color={Colors.light.subText} />
        </View>
        {getImageUrl(product.hinhAnhDaiDien) ? (
          <Image
            source={getImageUrl(product.hinhAnhDaiDien)}
            style={styles.image}
            contentFit="cover"
            transition={500}
          />
        ) : null}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.category}>{product.danhMuc?.tenDanhMuc}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.tenBienThe ? `${product.tenSp} - ${product.tenBienThe}` : product.tenSp}
        </Text>
        <Text style={styles.price}>
          {product.giaBan 
            ? `${product.giaBan.toLocaleString('vi-VN')}đ`
            : (product.giaTu === product.giaDen || !product.giaDen
                ? `${product.giaTu?.toLocaleString('vi-VN')}đ`
                : `${product.giaTu?.toLocaleString('vi-VN')}đ `)}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: Theme.spacing.xxl,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#f4f4f4',
    marginBottom: Theme.spacing.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xs,
  },
  category: {
    ...Theme.typography.subtitle,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.sm,
  },
  name: {
    ...Theme.typography.body,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
    color: Colors.light.text,
    lineHeight: 18,
  },
  price: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.light.text,
  }
});
