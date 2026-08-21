import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Service } from '../src/types';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { getImageUrl } from '../src/utils/imageUtils';

interface ServiceCardProps {
  service: Service;
  onPress: (id: string) => void;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);


export default function ServiceCard({ service, onPress, style }: ServiceCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => { scale.value = withTiming(0.97, { duration: 150 }); };
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 150 }); };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={() => onPress(service.maDv)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.imageContainer}>
        {(() => {
          const imageUri = service.hinhAnh ? getImageUrl(service.hinhAnh) : (service.hinhAnhs && service.hinhAnhs.length > 0 ? getImageUrl(service.hinhAnhs[0].duongDan) : null);
          return imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
              transition={500}
            />
          ) : null;
        })()}
        {/* Absolute Favorite Icon */}
        <Pressable style={styles.heartBtn} onPress={() => { }}>
          <Feather name="heart" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{service.tenDv}</Text>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={13} color="#111" style={{ marginRight: 4 }} />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={1}>{service.moTa}</Text>

        <View style={styles.priceRow}>
          {service.phanTramGiam ? (
            <Text style={styles.price}>
              {service.displayPrice || `${service.gia ? service.gia.toLocaleString('vi-VN') : '0'}đ`}{' '}
              <Text style={styles.originalPrice}>({service.giaGoc ? service.giaGoc.toLocaleString('vi-VN') : '0'}đ)</Text>
            </Text>
          ) : (
            <Text style={styles.price}>{service.displayPrice || `${service.gia ? service.gia.toLocaleString('vi-VN') : '0'}đ`}</Text>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.xl,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden', // Essential for clipping the image to the border radius
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4 / 3, // Landscape aspect ratio
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  infoContainer: {
    padding: 16, // Push text inward to create breathing room
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#111',
    flex: 1,
    paddingRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#111',
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#111',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#666',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  }
});
