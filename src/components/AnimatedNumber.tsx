import { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import { theme } from '../theme';

interface AnimatedNumberProps extends TextProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  mono?: boolean;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 400;
    const start = performance.now();
    const from = display;
    const diff = value - from;

    let frameId: number;
    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      setDisplay(from + diff * eased);

      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const formatted = display.toFixed(decimals);

  return (
    <Text
      style={[
        mono && { fontFamily: theme.fontMono },
        { color: theme.text, fontSize: 16 },
        style,
      ]}
      {...props}
    >
      {prefix}{formatted}{suffix}
    </Text>
  );
}
