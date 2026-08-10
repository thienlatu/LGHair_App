import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Đang tải dữ liệu...' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.tint} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
    minHeight: 200, // Đảm bảo chiếm đủ không gian khi dùng làm ListEmptyComponent
  },
  message: {
    marginTop: Theme.spacing.md,
    ...Theme.typography.body,
    color: Colors.light.subText,
    textAlign: 'center',
  },
});
