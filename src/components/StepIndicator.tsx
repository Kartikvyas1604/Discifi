import { Text, View } from 'react-native';
import { T, toRoman } from '../theme';

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <View style={{ alignItems: 'flex-end', paddingRight: T.s4, paddingTop: T.s7 }}>
      <Text
        style={{
          fontFamily: T.fontFigures,
          fontSize: 18,
          color: T.gold,
        }}
      >
        {toRoman(current)} / {toRoman(total)}
      </Text>
    </View>
  );
}
