import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  price: '#E90D0D',
  borderLighter: '#E1E1E1',
};

const FONT = {
  body: 'Inter_400Regular',
  bodyBold: 'Inter_600SemiBold',
  labelRegular: 'Inconsolata_400Regular',
};

const formatPrice = (price: number) => price.toLocaleString('vi-VN') + 'đ';


export interface CartLineItem {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string;
  loai?: string;
  stock?: number;
}

interface CartItemRowProps {
  item: CartLineItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onChangeQuantity?: (qty: number) => void;
}

export default function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  onChangeQuantity,
}: CartItemRowProps) {
  const router = useRouter();
  const isFontIcon = item.image && (item.image.startsWith('fas ') || item.image.startsWith('fa-'));
  const [localQty, setLocalQty] = React.useState(item.quantity.toString());

  React.useEffect(() => {
    setLocalQty(item.quantity.toString());
  }, [item.quantity]);

  const handleBlur = () => {
    let val = parseInt(localQty, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
    }
    setLocalQty(val.toString());
    onChangeQuantity?.(val);
  };

  return (
    <Pressable 
      style={styles.cartRow}
      onPress={() => {
        if (item.loai === 'DICHVU' || item.loai === 'COMBO') {
          router.push(`/service/${item.id}` as any);
        } else {
          router.push(`/product/${item.maSp || item.id}` as any);
        }
      }}
    >
      {!isFontIcon && (
        <View style={styles.cartThumbWrap}>
          {item.image ? (
            <Image source={{ uri: getImageUrl(item.image) }} style={styles.cartThumb} contentFit="cover" />
          ) : (
            <View style={[styles.cartThumb, { backgroundColor: COLORS.imagePlaceholder }]} />
          )}
        </View>
      )}

      <View style={styles.cartInfo}>
        <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
        {item.variant ? <Text style={styles.cartVariant}>{item.variant}</Text> : null}
        <Text style={styles.cartPrice}>{formatPrice(item.price)}</Text>
        {item.stock !== undefined && (
          <Text style={{ fontSize: scale(11), color: '#888', marginTop: scale(2) }}>
            Kho: {item.stock}
          </Text>
        )}
      </View>

      <View style={styles.cartActions}>
        <Pressable onPress={onRemove} hitSlop={10} style={{ marginBottom: scale(8), alignSelf: 'flex-end' }}>
          <Feather name="trash-2" size={scale(16)} color={COLORS.muted} />
        </Pressable>
        <View style={styles.qtyStepper}>
          <Pressable onPress={onDecrease} style={styles.qtyBtn} hitSlop={8}>
            <Text style={styles.qtyBtnText}>–</Text>
          </Pressable>
          <TextInput 
            style={[styles.qtyValue, { padding: 0, textAlign: 'center', minWidth: scale(30) }]}
            value={localQty}
            onChangeText={(text) => setLocalQty(text.replace(/[^0-9]/g, ''))}
            onBlur={handleBlur}
            keyboardType="number-pad"
            returnKeyType="done"
          />
          <Pressable onPress={onIncrease} style={styles.qtyBtn} hitSlop={8}>
            <Text style={styles.qtyBtnText}>+</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartRow: {
    flexDirection: 'row',
    paddingVertical: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLighter,
    alignItems: 'center',
  },
  cartThumbWrap: {
    width: scale(60),
    height: scale(60),
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLighter,
  },
  cartThumb: {
    width: '100%',
    height: '100%',
  },
  cartInfo: {
    flex: 1,
    paddingHorizontal: scale(12),
  },
  cartName: {
    fontFamily: FONT.body,
    fontSize: scale(14),
    color: COLORS.black,
    marginBottom: scale(4),
  },
  cartVariant: {
    fontFamily: FONT.body,
    fontSize: scale(12),
    color: COLORS.muted,
    marginBottom: scale(4),
  },
  cartPrice: {
    fontFamily: FONT.labelRegular,
    fontSize: scale(14),
    color: COLORS.price,
  },
  cartActions: {
    alignItems: 'flex-end',
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLighter,
    borderRadius: 4,
    height: scale(28),
  },
  qtyBtn: {
    width: scale(28),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontFamily: FONT.body,
    fontSize: scale(16),
    color: COLORS.muted,
  },
  qtyValue: {
    fontFamily: FONT.bodyBold,
    fontSize: scale(14),
    color: COLORS.black,
    width: scale(28),
    textAlign: 'center',
  },
});
