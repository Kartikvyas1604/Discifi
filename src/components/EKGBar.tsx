import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';

interface EKGBarProps {
  value: number;
  height?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function generateEKGWave(progress: number): string {
  const w = 300;
  const h = 40;
  const baseline = h / 2;
  const fillEnd = w * progress;

  let d = `M 0 ${baseline}`;

  for (let x = 0; x <= fillEnd; x += 2) {
    const normalizedX = x / w;
    let y = baseline;

    const spikeRegion = 0.3;
    const spikeWidth = 0.08;

    if (normalizedX > 0.2 && normalizedX < 0.2 + spikeWidth) {
      const t = (normalizedX - 0.2) / spikeWidth;
      if (t < 0.3) {
        y = baseline - 14 * (t / 0.3);
      } else if (t < 0.5) {
        y = baseline - 14 + 18 * ((t - 0.3) / 0.2);
      } else if (t < 0.7) {
        y = baseline + 4 - 18 * ((t - 0.5) / 0.2);
      } else {
        y = baseline - 14 + 14 * ((t - 0.7) / 0.3);
      }
    } else if (normalizedX < 0.3) {
      y = baseline + Math.sin(normalizedX * 30) * 1.5;
    } else if (normalizedX > 0.6) {
      y = baseline + Math.sin(normalizedX * 40 + 2) * 2;
    } else {
      y = baseline + Math.sin(normalizedX * 20 + 1) * 2.5;
    }

    d += ` L ${x} ${y}`;
  }

  if (fillEnd < w) {
    d += ` L ${fillEnd} 0 L 0 0 Z`;
  } else {
    d += ` L ${w} 0 L 0 0 Z`;
  }

  return d;
}

export function EKGBar({ value, height = 48 }: EKGBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [value, progress]);

  const pathLength = 300;
  const fillLength = pathLength * value;

  const animatedProps = useAnimatedProps(() => {
    const currentFill = fillLength * progress.value;
    const d = generateEKGWave(progress.value);
    return { d };
  });

  return (
    <View style={{ height, backgroundColor: theme.surface, borderRadius: 0, overflow: 'hidden' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${pathLength} ${height}`} preserveAspectRatio="none">
        <AnimatedPath
          animatedProps={animatedProps}
          fill={theme.accent}
          opacity={0.9}
        />
      </Svg>
      <Svg
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        width="100%"
        height={height}
        viewBox={`0 0 ${pathLength} ${height}`}
        preserveAspectRatio="none"
      >
        <Path
          d={`M 0 ${height / 2} L ${pathLength} ${height / 2}`}
          stroke={theme.border}
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}
