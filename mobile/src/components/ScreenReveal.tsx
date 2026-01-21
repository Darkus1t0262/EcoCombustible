import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

type ScreenRevealProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  distance?: number;
  duration?: number;
};

export const ScreenReveal = ({
  children,
  style,
  delay = 0,
  distance = 12,
  duration = 450,
}: ScreenRevealProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  const easing = useMemo(() => Easing.out(Easing.cubic), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, easing, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};
