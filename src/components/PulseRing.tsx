import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface PulseRingProps {
  size?: number;
  color?: string;
  count?: number;
}

function Ring({ size, color, delay }: { size: number; color: string; delay: number }) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: color,
          top: 0,
          left: 0,
          opacity: 0,
        },
        animatedStyle,
      ]}
    />
  );
}

export function PulseRing({ size = 240, color = theme.warning, count = 3 }: PulseRingProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Ring key={i} size={size} color={color} delay={i * 400} />
      ))}
    </View>
  );
}
