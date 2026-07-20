import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import PrimaryButton from '../../components/PrimaryButton';
import AppToast from '../../components/ui/AppToast';
import { useAuthStore } from '../../src/stores/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    // Về trang home hoặc login tùy ý
    router.replace('/');
  };

  return (
    <View style={styles.container}>


      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 80, paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarPlaceholder}>
          {user?.hinhAnh ? (
            <Image source={user.hinhAnh} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <Feather name="user" size={32} color={Colors.light.text} />
          )}
        </View>

        <Text style={styles.name}>{user?.hoTen || 'Người dùng'}</Text>
        <Text style={styles.email}>{user?.email || 'Đang tải...'}</Text>

        {user?.tenRank && (
          <Text style={{ textAlign: 'center', color: Colors.light.tint, marginBottom: 10, fontWeight: 'bold' }}>Hạng: {user.tenRank}</Text>
        )}

        <View style={styles.menuList}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/profile/appointments')}>
            <Text style={styles.menuText}>Lịch hẹn</Text>
            <Feather name="chevron-right" size={20} color={Colors.light.icon} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/profile/orders')}>
            <Text style={styles.menuText}>Đơn Hàng Của Tôi</Text>
            <Feather name="chevron-right" size={20} color={Colors.light.icon} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push('/profile/personal-info')}>
            <Text style={styles.menuText}>Thông tin cá nhân</Text>
            <Feather name="chevron-right" size={20} color={Colors.light.icon} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            {
              width: '100%',
              backgroundColor: '#dc2626',
              marginTop: 20,
              paddingVertical: 16,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center'
            },
            pressed && { opacity: 0.8 }
          ]}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>ĐĂNG XUẤT</Text>
        </Pressable>
      </ScrollView>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    padding: Theme.spacing.sm,
    width: 44,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_300Light',
    fontSize: 16,
    letterSpacing: 4,
    color: Colors.light.text,
  },
  content: {
    padding: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxxl,
    paddingBottom: 100,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  name: {
    ...Theme.typography.h2,
    fontSize: 18,
    marginBottom: Theme.spacing.xs,
  },
  email: {
    ...Theme.typography.body,
    color: Colors.light.subText,
    marginBottom: Theme.spacing.md,
  },
  menuList: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginBottom: Theme.spacing.xxxl,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuText: {
    ...Theme.typography.subtitle,
    color: Colors.light.text,
  },
  loginBtn: {
    width: '100%',
    marginBottom: Theme.spacing.xl,
  }
});
