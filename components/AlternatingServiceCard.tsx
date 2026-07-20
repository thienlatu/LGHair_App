import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome } from '@expo/vector-icons';
import { Service } from '../src/types';
import { API_BASE_URL } from '../src/services/apiClient';

interface Props {
  service: Service;
  index: number;
  onPressDetail: (id: string) => void;
  onPressBook: (id: string) => void;
  onPressAdd?: (id: string) => void;
  isAdded?: boolean;
  style?: ViewStyle;
}

const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
};

export default function AlternatingServiceCard({ service, index, onPressDetail, onPressBook, onPressAdd, isAdded, style }: Props) {
  const isImageRight = index % 2 !== 0;

  const imageUri = service.hinhAnh 
    ? getImageUrl(service.hinhAnh) 
    : (service.hinhAnhs && service.hinhAnhs.length > 0 ? getImageUrl(service.hinhAnhs[0].duongDan) : '');

  const ImageComponent = (
    <View style={styles.imageContainer}>
      {!!imageUri && (
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          contentFit="cover" 
          transition={500} 
        />
      )}
    </View>
  );

  const InfoComponent = (
    <View style={[styles.infoContainer, !isImageRight ? { paddingLeft: '5%' } : { paddingRight: '5%' }]}>
      <View style={styles.textContent}>
        <Text style={styles.duration}>
          {service.thoiGianLam ? `${service.thoiGianLam} PHÚT` : '120-180 PHÚT'}
        </Text>
      
      <Text style={styles.title} numberOfLines={2}>
        {service.tenDv?.toUpperCase() || ''}
      </Text>
      
      <Text style={styles.price}>
        {service.displayPrice || `Từ ${service.gia ? service.gia.toLocaleString('vi-VN') + ' VNĐ' : '250'}`}
      </Text>
      
      <Text style={styles.desc} numberOfLines={2}>
        {service.moTa || 'Nhuộm màu đa tầng và phủ bóng thiết kế riêng.'}
      </Text> 
      
      <View style={styles.buttonRow}>
        <Pressable style={[styles.btnOutline, isAdded && { backgroundColor: '#333' }]} onPress={(e) => {
          e.stopPropagation();
          if (onPressAdd) {
            onPressAdd(service.maDv);
          } else {
            onPressDetail(service.maDv);
          }
        }}>
          <Text style={[styles.btnOutlineText, isAdded && { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>
            {onPressAdd ? (isAdded ? "XÓA" : "ADD TO LIST") : "XEM CHI TIẾT"}
          </Text>
        </Pressable>
        <Pressable style={styles.btnSolid} onPress={(e) => {
          e.stopPropagation();
          onPressBook(service.maDv);
        }}>
          <Text style={styles.btnSolidText} numberOfLines={1} adjustsFontSizeToFit>
            ĐẶT LỊCH NGAY
          </Text>
        </Pressable>
      </View>
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <FontAwesome key={star} name="star" size={9} color="#E8D155" />
        ))}
      </View>
    </View>
  );

  return (
    <Pressable style={[styles.container, style]} onPress={() => onPressDetail(service.maDv)}>
      {!isImageRight ? ImageComponent : InfoComponent}
      {!isImageRight ? InfoComponent : ImageComponent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 40,
    alignItems: 'center',
  },
  imageContainer: {
    width: '45%', // Responsive width
    aspectRatio: 164 / 198, // Exact Figma ratio
   
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8, 
    
  },
  infoContainer: {
    width: '55%', // Responsive width
    justifyContent: 'center',
  },
  textContent: {
    width: '100%',
  },
  duration: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#A0A0A0',
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter_300Light',
    fontSize: 13, // Đã chỉnh chuẩn 13px theo thiết kế
    color: '#333',
    letterSpacing: 1.5,
    marginBottom: 6,
    lineHeight: 20,
  },
  price: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#333',
    marginBottom: 16,
  },
  desc: {
    fontFamily: 'Inter_300Light',
    fontSize: 11,
    color: '#888',
    lineHeight: 16,
    marginBottom: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6, // Khoảng cách giữa 2 nút bấm
    marginTop: 12, // Tạo khoảng cách với phần mô tả
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 2,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    color: '#333',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  btnSolid: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 2,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSolidText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    color: '#fff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4, // Khoảng cách giữa các ngôi sao
    marginTop: 15, // Đúng 15px từ bottom của button theo thiết kế
  }
});