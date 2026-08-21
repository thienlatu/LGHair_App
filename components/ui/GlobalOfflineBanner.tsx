import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GlobalOfflineBanner() {
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  // Hiển thị nếu trạng thái mạng đã load xong nhưng không có Internet
  const isOffline = netInfo.type !== 'unknown' && (!netInfo.isConnected || netInfo.isInternetReachable === false);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Feather name="wifi-off" size={14} color="#FFF" style={styles.icon} />
        <Text style={styles.text}>Không có kết nối Internet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#EF4444',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
