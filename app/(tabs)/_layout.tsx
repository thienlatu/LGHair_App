import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import Header from '../../components/Header';
import { usePathname } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useScrollStore } from '../../src/stores/useScrollStore';
import { useCartStore } from '../../src/stores/useCartStore';

function AnimatedTabBar(props: any) {
  const isTabBarVisible = useScrollStore((state) => state.isTabBarVisible);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isTabBarVisible ? 0 : 150, // Trượt hẳn xuống 150px để giấu kín tab bar
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible]);

  return (
    <Animated.View style={{ transform: [{ translateY }], position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const fetchCart = useCartStore(state => state.fetchCart);
  
  const isBooking = pathname.includes('booking');
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {!isBooking && <Header />}
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: '#111',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#eaeaea',
            elevation: 0,
            shadowOpacity: 0,
            paddingTop: 8,
            // Không set cứng height để BottomTabBar tự động tính toán Safe Area (vùng Home Indicator của iPhone)
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginTop: 4,
            paddingBottom: Platform.OS === 'android' ? 8 : 0, // Padding phụ cho Android
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Feather size={18} name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: 'Dịch vụ',
            tabBarIcon: ({ color }) => <Feather size={18} name="scissors" color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color }) => <Feather size={18} name="shopping-bag" color={color} />,
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            title: 'Đặt lịch',
            tabBarIcon: ({ color }) => <Feather size={18} name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Tôi',
            tabBarIcon: ({ color }) => <Feather size={18} name="user" color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              if (!isAuthenticated) {
                e.preventDefault();
                router.push('/login');
              }
            },
          }}
        />
      </Tabs>
    </View>
  );
}
