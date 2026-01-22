import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, TextStyle } from 'react-native';

type CountUpTextProps = {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (value: number) => string;
  style?: StyleProp<TextStyle>;
};

export const CountUpText = ({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  formatter,
  style,
}: CountUpTextProps) => {
  const animated = useRef(new Animated.Value(value)).current;
  const previous = useRef(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = previous.current ?? 0;
    animated.setValue(start);
    const id = animated.addListener(({ value: current }) => {
      setDisplay(current);
    });

    const animation = Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) {
        previous.current = value;
      }
    });

    return () => {
      animation.stop();
      animated.removeListener(id);
    };
  }, [animated, duration, value]);

  const text = formatter ? formatter(display) : `${Math.round(display)}`;
  return <Animated.Text style={style}>{`${prefix}${text}${suffix}`}</Animated.Text>;
};
