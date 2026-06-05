import { View, type ViewProps } from 'react-native';
import { T } from '../theme';

interface AccentCardProps extends ViewProps {
  accentColor?: string;
  children: React.ReactNode;
}

export function AccentCard({ accentColor = T.gold, children, style, ...props }: AccentCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: T.surface,
          borderWidth: T.hairline,
          borderColor: T.border,
          padding: T.s4,
          flexDirection: 'row',
        },
        style,
      ]}
      {...props}
    >
      <View style={{ width: T.accentBar, backgroundColor: accentColor, marginRight: T.s3 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
