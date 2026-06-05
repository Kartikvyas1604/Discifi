import { useEffect } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { T } from '../theme';

interface GoldToggleProps {
  active: boolean;
  onToggle: () => void;
}

export function GoldToggle({ active, onToggle }: GoldToggleProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 150, easing: Easing.ease });
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withTiming(1.2, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 150, easing: Easing.ease });
    });
    onToggle();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={animatedStyle}>
        <Text
          style={{
            fontSize: 20,
            color: active ? T.gold : T.inkFaint,
            fontFamily: T.fontBody,
          }}
        >
          {active ? '●' : '○'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}
