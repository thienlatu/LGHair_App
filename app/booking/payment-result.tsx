import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { bookingApi } from '../../src/services/bookingApi';
import { useCartStore } from '../../src/stores/useCartStore';

export default function PaymentResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'success' | 'failed' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
useEffect(() => {
    const responseCode = params.vnp_ResponseCode as string;
    const isCOD = params.isCOD as string;
    const maHd = params.maHd as string; // Lấy mã hóa đơn truyền từ màn payment sang

    // Tạo một hàm async bên trong useEffect để gọi API
    const confirmOrderOnServer = async () => {
      if (isCOD === 'true') {
        setStatus('success');
        useCartStore.getState().clearCart();
        useCartStore.getState().resetCart();
        return;
      }

      if (!responseCode) {
        setStatus('failed');
        setErrorMessage('Không nhận được kết quả thanh toán hợp lệ.');
        return;
      }

      if (responseCode !== '00') {
        setStatus('failed');
        setErrorMessage(`Giao dịch thất bại (Mã lỗi: ${responseCode})`);
        return;
      }

      // Đến đây là VNPay báo thành công, tiến hành gọi API đồng bộ xuống Backend
      if (maHd) {
        try {
          if (maHd.startsWith('SP')) {
            await bookingApi.confirmProductPayment(maHd, responseCode);
          } 
          else if (maHd.startsWith('TH') || maHd.startsWith('LD')) {
            await bookingApi.getReceipt(maHd, responseCode);
          }
          
          // API thành công mới hiển thị giao diện Thành công và xóa giỏ hàng
          setStatus('success');
          useCartStore.getState().clearCart();
          useCartStore.getState().resetCart();
        } catch (error) {
          console.log("Lỗi khi xác nhận đơn với Backend:", error);
          setStatus('failed');
          setErrorMessage('Giao dịch VNPay thành công nhưng không thể đồng bộ với hệ thống. Vui lòng liên hệ Hotline kèm mã giao dịch để được hỗ trợ.');
        }
      } else {
        // Trường hợp lạ: Thành công nhưng mất mã HD
        setStatus('failed');
        setErrorMessage('Đã thanh toán nhưng mất mã đối soát. Vui lòng liên hệ hỗ trợ.');
      }
    };

  
    confirmOrderOnServer();

  }, [params]);

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={{ fontFamily: 'Inconsolata_400Regular', color: Colors.light.text }}>Đang xử lý kết quả...</Text>
      </View>
    );
  }

  const isSuccess = status === 'success';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        
        {/* Icon Header */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.iconContainer}>
          <View style={[
            styles.iconCircle, 
            { backgroundColor: isSuccess ? '#E8F5E9' : '#FFEBEE' }
          ]}>
            <Feather 
              name={isSuccess ? "check-circle" : "x-circle"} 
              size={64} 
              color={isSuccess ? "#4CAF50" : "#F44336"} 
            />
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.textContainer}>
          <Text style={styles.title}>
            {isSuccess ? (params.isCOD === 'true' ? 'ĐẶT HÀNG THÀNH CÔNG' : 'THANH TOÁN THÀNH CÔNG') : 'GIAO DỊCH THẤT BẠI'}
          </Text>
          <Text style={styles.subtitle}>
            {isSuccess 
              ? (params.isCOD === 'true' ? 'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ sớm giao hàng cho bạn.' : 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Đơn hàng của bạn đã được ghi nhận.')
              : errorMessage || 'Đã có lỗi xảy ra trong quá trình giao dịch. Vui lòng thử lại sau.'}
          </Text>
        </Animated.View>

        {/* Details Card (Optional, can expand based on params) */}
        {isSuccess && params.vnp_Amount && (
           <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.detailsCard}>
             <View style={styles.detailRow}>
               <Text style={styles.detailLabel}>Mã giao dịch:</Text>
               <Text style={styles.detailValue}>{params.vnp_TransactionNo}</Text>
             </View>
             <View style={styles.detailRow}>
               <Text style={styles.detailLabel}>Số tiền:</Text>
               <Text style={styles.detailValue}>
                 {/* VNPay amount is multiplied by 100 */}
                 {Number(params.vnp_Amount) / 100} VNĐ
               </Text>
             </View>
           </Animated.View>
        )}

      </Animated.View>

      {/* Footer Buttons */}
      <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.footer}>
        <PrimaryButton 
          title="VỀ TRANG CHỦ" 
          onPress={() => router.replace('/(tabs)')} 
          style={styles.mainButton}
        />
        {!isSuccess && (
          <Pressable onPress={() => router.back()} style={styles.retryButton}>
            <Text style={styles.retryText}>THỬ LẠI</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inconsolata_600SemiBold',
    fontSize: 24,
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  detailsCard: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontFamily: 'InclusiveSans_400Regular',
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontFamily: 'Inconsolata_600SemiBold',
    fontSize: 15,
    color: Colors.light.text,
  },
  footer: {
    padding: 24,
    gap: 16,
  },
  mainButton: {
    width: '100%',
  },
  retryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryText: {
    fontFamily: 'Inconsolata_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
    textDecorationLine: 'underline',
  }
});
