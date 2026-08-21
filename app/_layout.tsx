import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useAuthStore } from '../src/stores/useAuthStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlobalOfflineBanner from '../components/ui/GlobalOfflineBanner';
import { useAppLifecycle } from '../src/network/useAppLifecycle';

import { useFonts } from 'expo-font';
import { Inter_300Light } from '@expo-google-fonts/inter/300Light';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display/400Regular_Italic';
import { Inconsolata_400Regular } from '@expo-google-fonts/inconsolata/400Regular';
import { JosefinSlab_400Regular } from '@expo-google-fonts/josefin-slab/400Regular';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_400Regular_Italic,
    Inconsolata_400Regular,
    JosefinSlab_400Regular,
  });

  const checkAuth = useAuthStore(state => state.checkAuth);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Kích hoạt App Lifecycle (Foreground Revalidation & Network Recovery)
  useAppLifecycle();

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: '554413864784-ietlbhd76soro8rchkgrkmugsi4p40cg.apps.googleusercontent.com',
        iosClientId: '554413864784-ajlotdndg3gjvmkn1mrgkdtb74ane280.apps.googleusercontent.com',
        offlineAccess: false,
      });
    } catch (e) {
      console.error('GoogleSignin config error:', e);
    }

    checkAuth().finally(() => {
      setIsAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && isAuthChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAuthChecked]);

  if (!loaded || !isAuthChecked) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GlobalOfflineBanner />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="service/[id]" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
