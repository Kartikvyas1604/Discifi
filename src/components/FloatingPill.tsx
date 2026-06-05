import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface FloatingPillProps {
  label: string;
  count: number;
}

export function FloatingPill({ label, count }: FloatingPillProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.accent,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: theme.accentDim,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 5,
          height: 5,
          backgroundColor: theme.bg,
          marginRight: 6,
        }}
      />
      <Text
        style={{
          fontFamily: theme.fontMono,
          fontSize: 10,
          color: theme.bg,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: theme.fontMonoBold,
          fontSize: 10,
          color: theme.bg,
          marginLeft: 4,
        }}
      >
        {count}
      </Text>
    </Animated.View>
  );
}
