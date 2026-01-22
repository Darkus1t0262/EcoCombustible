import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle, type AccessibilityRole } from 'react-native';

type PressableScaleProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
};

export const PressableScale = ({
  children,
  onPress,
  disabled,
  scaleTo = 0.97,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityHint,
}: PressableScaleProps) => {
  const scale = useRef(new Animated.Value(1)).current;
  const AnimatedPressable = useRef(Animated.createAnimatedComponent(Pressable)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityHint={accessibilityHint}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
};
