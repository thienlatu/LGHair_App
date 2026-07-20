import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ visible, title = 'THÔNG BÁO', message, onClose }: ErrorModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.closeIcon} onPress={onClose}>
            <Feather name="x" size={20} color="#999" />
          </Pressable>
          
          <Feather name="alert-circle" size={54} color="#8b0000" style={styles.icon} />
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>ĐÓNG</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    // No rounded corners based on the design
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  icon: {
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  message: {
    fontFamily: 'Inter_300Light',
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#000',
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
