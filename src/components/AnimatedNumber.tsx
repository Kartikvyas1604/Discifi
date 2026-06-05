import { useEffect, useRef } from 'react';
import { Text, type TextProps } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface AnimatedNumberProps extends TextProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  mono?: boolean;
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  mono = true,
  style,
  ...props
}: AnimatedNumberProps) {
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animatedValue]);

  const animatedProps = useAnimatedProps(() => {
    const display = animatedValue.value.toFixed(decimals);
    const parts = display.split('.');
    const intPart = parts[0].split('').join('');
    const decPart = parts[1] || '0'.repeat(decimals);

    const chars = intPart.split('').map((c, i) => ({ char: c, index: intPart.length - i }));
    const result = chars.map(({ char }) => char).join('') + (decimals > 0 ? '.' : '') + decPart;

    return {
      text: `${prefix}${result}${suffix}`,
    } as never;
  });

  return (
    <AnimatedText
      animatedProps={animatedProps}
      style={[
        mono && { fontFamily: theme.fontMono },
        { color: theme.text, fontSize: 16 },
        style,
      ]}
      {...props}
    />
  );
}
