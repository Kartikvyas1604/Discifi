import { View, type ViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { theme } from '../theme';

interface CutCornerCardProps extends ViewProps {
  clipSize?: number;
  borderColor?: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

export function CutCornerCard({
  clipSize = theme.clipCorner,
  borderColor = theme.border,
  backgroundColor = theme.surface,
  children,
  style,
  ...props
}: CutCornerCardProps) {
  const s = clipSize;
  const bw = 1;

  return (
    <View style={[{ position: 'relative' }, style]} {...props}>
      <Svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Polygon
          points={`${bw},${bw} ${100 - s - bw},${bw} ${100 - bw},${s + bw} ${100 - bw},${100 - bw} ${bw},${100 - bw}`}
          fill={backgroundColor}
          stroke={borderColor}
          strokeWidth={bw * 2}
        />
      </Svg>
      <View style={{ padding: 16, position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
}
