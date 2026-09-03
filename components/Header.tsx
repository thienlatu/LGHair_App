import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useCartStore } from '../src/stores/useCartStore';

export default function Header() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCartStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {Platform.OS === 'ios' && (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      )}

      <View style={styles.content}>
        {/* Search Bar (now a button routing to /search) */}
        <Pressable 
          style={styles.searchContainer}
          onPress={() => router.push('/search')}
        >
          <Text style={[styles.searchInput, { color: Colors.light.text, opacity: 0.6 }]}>
            Tìm kiếm...
          </Text>
          <View style={styles.searchButton}>
            <Feather name="search" size={16} color="white" />
          </View>
        </Pressable>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          <Pressable style={styles.iconButton} onPress={() => router.push('/support/support')}>
            <Feather name="message-circle" size={22} color={Colors.light.text} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/cart')}>
            <View>
              <Feather name="shopping-bag" size={22} color={Colors.light.text} />
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.borderBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    height: 55,
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    width: 250,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 10,
    color: '#000',
    backgroundColor: 'transparent',
  },
  searchButton: {
    width: 32,
    height: 32,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  logo: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    letterSpacing: 4,
    color: Colors.light.text,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935', // Red background
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,


  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF', // White text
    fontSize: 9
  },
  borderBottom: {
    height: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  }
});
