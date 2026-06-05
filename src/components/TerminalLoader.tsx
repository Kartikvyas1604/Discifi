import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../theme';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface TerminalLoaderProps {
  dots?: number;
}

export function TerminalLoader({ dots = 4 }: TerminalLoaderProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.linear }),
      -1,
      true,
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const count = Math.floor(interpolate(progress.value, [0, 1], [0, dots]));
    return { text: '.'.repeat(count) } as never;
  });

  return (
    <AnimatedText
      animatedProps={animatedProps}
      style={{
        fontFamily: theme.fontMono,
        fontSize: 16,
        color: theme.muted,
        letterSpacing: 2,
      }}
    />
  );
}
