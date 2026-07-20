import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Theme = {
  typography: {
    h1: {
      fontFamily: 'Inter_300Light',
      fontSize: 28,
      lineHeight: 38,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
    },
    h2: {
      fontFamily: 'Inter_300Light',
      fontSize: 22,
      lineHeight: 30,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    h3: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 24,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
    },
    editorial: {
      fontFamily: 'PlayfairDisplay_400Regular_Italic',
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: 0,
      textTransform: 'lowercase' as const,
    },
    subtitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      lineHeight: 16,
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
    },
    body: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 22,
      letterSpacing: 0.5,
    },
    button: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
      textTransform: 'uppercase' as const,
      letterSpacing: 2,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 80,
  },
  layout: {
    width,
    height,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  }
};
