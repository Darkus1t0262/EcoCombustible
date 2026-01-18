import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export const Skeleton = ({ width = '100%', height = 12, radius = 10, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: COLORS.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
};
