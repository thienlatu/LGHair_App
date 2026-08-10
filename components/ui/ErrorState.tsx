import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ErrorState({ 
  title = 'Đã có lỗi xảy ra', 
  message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng và thử lại.', 
  onRetry,
  retryLabel = 'Thử lại'
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline-outline" size={56} color="#ef4444" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onRetry && (
        <Pressable style={styles.button} onPress={onRetry}>
          <Ionicons name="reload-outline" size={16} color={Colors.dark.text} style={styles.btnIcon} />
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    minHeight: 250,
  },
  iconContainer: {
    backgroundColor: '#fef2f2', // red-50
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.full,
    marginBottom: Theme.spacing.lg,
  },
  title: {
    ...Theme.typography.subtitle,
    fontSize: 16,
    color: '#ef4444', // red-500
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  button: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm + 4,
    borderRadius: Theme.radius.full,
  },
  btnIcon: {
    marginRight: Theme.spacing.xs,
  },
  buttonText: {
    ...Theme.typography.button,
    color: Colors.dark.text,
  },
});
