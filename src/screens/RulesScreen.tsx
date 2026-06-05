import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { theme, spacing } from '../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type RuleCategory = 'spending' | 'allowlist' | 'frequency' | 'amount' | 'category';
type RuleStatus = 'active' | 'paused';

interface Rule {
  id: string;
  type: RuleCategory;
  label: string;
  value: string;
  status: RuleStatus;
}

const CATEGORIES: { key: RuleCategory; label: string }[] = [
  { key: 'spending', label: 'Spending' },
  { key: 'allowlist', label: 'Allowlist' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'amount', label: 'Amount' },
  { key: 'category', label: 'Category' },
];

const MOCK_RULES: Rule[] = [
  { id: '1', type: 'spending', label: 'Daily Limit', value: '$800 USD', status: 'active' },
  { id: '2', type: 'allowlist', label: 'Approved DEXs', value: '6 contracts', status: 'active' },
  { id: '3', type: 'frequency', label: 'Tx Cooldown', value: '30 seconds', status: 'active' },
  { id: '4', type: 'amount', label: 'Max Per Tx', value: '$2,500', status: 'paused' },
  { id: '5', type: 'category', label: 'Meme Coin Filter', value: 'Blocked', status: 'active' },
];

function CutCornerSVG({ size = 14 }: { size?: number }) {
  const s = size;
  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <Polygon
        points={`1,1 ${100 - s - 1},1 ${100 - 1},${s + 1} ${100 - 1},${100 - 1} 1,${100 - 1}`}
        fill={theme.surface}
        stroke={theme.border}
        strokeWidth={1}
      />
    </Svg>
  );
}

function AnimatedToggle({ status }: { status: RuleStatus }) {
  const isActive = status === 'active';
  const thumbPosition = useSharedValue(isActive ? 16 : 2);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive ? theme.accent : theme.border,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbPosition.value }],
  }));

  return (
    <View
      style={{
        width: 36,
        height: 18,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 12,
              height: 12,
              backgroundColor: theme.bg,
              position: 'absolute',
              top: 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}

function RuleCard({ rule, index }: { rule: Rule; index: number }) {
  const scale = useSharedValue(1);
  const [toggled, setToggled] = useState(rule.status);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(100 + index * 80).duration(400)}>
      <AnimatedTouchable
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        style={[styles.ruleCard, animatedStyle]}
        activeOpacity={1}
      >
        <CutCornerSVG size={14} />
        <View style={{ position: 'relative', zIndex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ruleType}>{rule.type.toUpperCase()}</Text>
            <Text style={styles.ruleValue}>{rule.value}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setToggled(t => t === 'active' ? 'paused' : 'active')}
            style={{ marginRight: spacing.md }}
          >
            <AnimatedToggle status={toggled} />
          </TouchableOpacity>
          <Text style={styles.ruleEdit}>[EDIT]</Text>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

export default function RulesScreen() {
  const [activeCategory, setActiveCategory] = useState<RuleCategory>('spending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pathText}>~/wallet/rules</Text>
        <Text style={styles.ruleCount}>{MOCK_RULES.length} rules</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.chip,
              activeCategory === cat.key && styles.chipActive,
            ]}
            onPress={() => setActiveCategory(cat.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                activeCategory === cat.key && styles.chipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_RULES
          .filter(r => r.type === activeCategory)
          .map((rule, i) => (
            <RuleCard key={rule.id} rule={rule} index={i} />
          ))}

        <Animated.View
          entering={FadeIn.duration(400).delay(400)}
          style={styles.addCard}
        >
          <Text style={styles.addGlyph}>+</Text>
          <Text style={styles.addText}>ADD RULE</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  pathText: {
    fontFamily: theme.fontMono,
    fontSize: 13,
    color: theme.accent,
    letterSpacing: 0.5,
  },
  ruleCount: {
    fontFamily: theme.fontMono,
    fontSize: 11,
    color: theme.muted,
  },
  chipScroll: {
    maxHeight: 40,
    marginBottom: spacing.lg,
  },
  chipContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 2,
    shadowColor: theme.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 3,
  },
  chipActive: {
    borderColor: theme.accent,
    backgroundColor: theme.accent,
  },
  chipText: {
    fontFamily: theme.fontBody,
    fontSize: 11,
    color: theme.textDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipTextActive: {
    color: theme.bg,
    fontWeight: '600',
  },
  ruleCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 80,
    position: 'relative',
    justifyContent: 'center',
  },
  ruleType: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ruleValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 18,
    color: theme.text,
  },
  ruleEdit: {
    fontFamily: theme.fontMono,
    fontSize: 11,
    color: theme.accent,
    letterSpacing: 1,
  },
  addCard: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addGlyph: {
    fontFamily: theme.fontMonoBold,
    fontSize: 20,
    color: theme.mutedLight,
  },
  addText: {
    fontFamily: theme.fontBody,
    fontSize: 11,
    color: theme.mutedLight,
    letterSpacing: 2,
  },
});
