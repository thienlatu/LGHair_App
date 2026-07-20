import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Theme } from '../../constants/Theme';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
        headerTitleStyle: {
          fontFamily: 'Inter_300Light',
          fontSize: 16,
          letterSpacing: 2,
        } as any,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="appointments"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'LỊCH SỬ MUA HÀNG',
        }}
      />
      <Stack.Screen
        name="personal-info"
        options={{
          title: 'THÔNG TIN CÁ NHÂN',
        }}
      />
    </Stack>
  );
}
