import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { Feather } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconRight?: keyof typeof Feather.glyphMap;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PrimaryButton({
  title,
  onPress,
  style,
  textStyle,
  iconRight,
  variant = 'primary',
  disabled = false
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => { 
    setIsPressed(true);
    scale.value = withTiming(0.97, { duration: 150 }); 
  };
  const handlePressOut = () => { 
    setIsPressed(false);
    scale.value = withTiming(1, { duration: 150 }); 
  };

  const getContainerStyle = (pressed: boolean) => {
    let baseStyle: any = [styles.container];

    if (variant === 'primary') {
      baseStyle.push({ backgroundColor: Colors.light.text });
      if (pressed && !disabled) baseStyle.push({ opacity: 0.9 });
    } else if (variant === 'outline') {
      baseStyle.push({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.light.border
      });
      if (pressed && !disabled) baseStyle.push({ backgroundColor: '#fafafa' });
    } else if (variant === 'ghost') {
      baseStyle.push({ backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 8 });
      if (pressed && !disabled) baseStyle.push({ opacity: 0.6 });
    }

    if (disabled) {
      baseStyle.push({ opacity: 0.5 });
    }

    return [baseStyle, style];
  };

  const getTextStyle = () => {
    let baseStyle: any = [styles.text];

    if (variant === 'primary') {
      baseStyle.push({ color: Colors.light.background });
    } else {
      baseStyle.push({ color: Colors.light.text });
    }

    return [baseStyle, textStyle];
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[getContainerStyle(isPressed), animatedStyle]}
    >
      <Text style={getTextStyle()} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
      {iconRight && (
        <Feather
          name={iconRight}
          size={16}
          color={variant === 'primary' ? Colors.light.background : Colors.light.text}
          style={{ marginLeft: 12 }}
        />
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: 12, // Sharp edges for luxury feel
  },
  text: {
    ...Theme.typography.button,
    textAlign: 'center',
  },
});
