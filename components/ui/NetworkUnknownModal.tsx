import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import PrimaryButton from '../PrimaryButton';

interface NetworkUnknownModalProps {
  visible: boolean;
  onClose: () => void;
  onGoToHistory: () => void;
}

export default function NetworkUnknownModal({ visible, onClose, onGoToHistory }: NetworkUnknownModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={32} color="#F59E0B" />
          </View>
          
          <Text style={styles.title}>Kết nối bị gián đoạn!</Text>
          
          <Text style={styles.message}>
            Giao dịch thanh toán của bạn có thể đã được ghi nhận nhưng chúng tôi không nhận được phản hồi do lỗi mạng.
          </Text>
          
          <Text style={styles.warningText}>
            Vui lòng <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#EF4444' }}>KHÔNG</Text> thanh toán lại ngay để tránh bị trùng đơn hàng. Hãy kiểm tra Lịch sử trước khi tiếp tục.
          </Text>

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title="Đi tới Lịch sử" 
              onPress={onGoToHistory}
              style={styles.mainButton}
            />
            
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: Theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7', // Amber-100
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    ...Theme.typography.h2,
    color: Colors.light.text,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  warningText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
    padding: Theme.spacing.md,
    backgroundColor: '#FEE2E2', // Red-100
    borderRadius: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: Theme.spacing.md,
  },
  mainButton: {
    width: '100%',
  },
  closeButton: {
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.light.subText,
  }
});
