import Svg, { Path, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';

interface RadialGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function RadialGauge({
  value,
  size = 80,
  strokeWidth = 6,
  label,
}: RadialGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth * 2) / 2;
  const startAngle = 220;
  const endAngle = 320;
  const range = endAngle - startAngle;
  const fillAngle = startAngle + range * Math.min(value, 1);

  const trackArc = describeArc(cx, cy, radius, startAngle, endAngle);
  const fillArc = describeArc(cx, cy, radius, startAngle, fillAngle);

  const getColor = (val: number) => {
    if (val < 0.35) return theme.green;
    if (val < 0.65) return theme.amber;
    return theme.red;
  };

  return (
    <Svg width={size} height={size + (label ? 20 : 0)}>
      <Defs>
        <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={theme.green} stopOpacity="1" />
          <Stop offset="40%" stopColor={theme.amber} stopOpacity="1" />
          <Stop offset="100%" stopColor={theme.red} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <G rotation={0} origin={`${cx}, ${cy}`}>
        <Path
          d={trackArc}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="butt"
        />
        <Path
          d={fillArc}
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="butt"
        />
        <SvgText
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          fontSize={16}
          fontFamily={theme.fontMonoBold}
          fill={getColor(value)}
          fontWeight="700"
        >
          {Math.round(value * 100)}
        </SvgText>
        {label && (
          <SvgText
            x={cx}
            y={cy + radius + strokeWidth + 16}
            textAnchor="middle"
            fontSize={9}
            fontFamily={theme.fontBody}
            fill={theme.muted}
          >
            {label}
          </SvgText>
        )}
      </G>
    </Svg>
  );
}
