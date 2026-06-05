import { Text, type TextStyle } from 'react-native';
import { T } from '../theme';

interface GlyphProps {
  symbol: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

export function Glyph({ symbol, size = 24, color = T.gold, style }: GlyphProps) {
  return (
    <Text
      style={[
        {
          fontSize: size,
          color,
          fontFamily: T.fontBody,
          textAlign: 'center',
        },
        style,
      ]}
    >
      {symbol}
    </Text>
  );
}
