import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

interface EmptyStateProps {
  title?: string;
  message?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  actionLabel?: string;
}

export default function EmptyState({ 
  title = 'Chưa có dữ liệu', 
  message = 'Không tìm thấy dữ liệu nào ở đây.', 
  iconName = 'folder-open-outline',
  onAction,
  actionLabel = 'Thử lại'
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={64} color={Colors.light.icon} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onAction && (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
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
    minHeight: 250, // Chiều cao tối thiểu để component luôn hiển thị rõ trong FlatList
  },
  icon: {
    marginBottom: Theme.spacing.md,
    opacity: 0.5,
  },
  title: {
    ...Theme.typography.subtitle,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.full,
  },
  buttonText: {
    ...Theme.typography.button,
    color: Colors.dark.text,
  },
});
