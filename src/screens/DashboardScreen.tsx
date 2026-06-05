import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { theme, spacing } from '../theme';
import { EKGBar } from '../components/EKGBar';
import { RadialGauge } from '../components/RadialGauge';
import { FloatingPill } from '../components/FloatingPill';
import { TerminalLoader } from '../components/TerminalLoader';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface Transaction {
  id: string;
  address: string;
  token: string;
  amount: string;
  risk: 'low' | 'medium' | 'high';
  time: string;
}

const MOCK_TX: Transaction[] = [
  { id: '1', address: '0x7a3b...9f2c', token: 'SOL', amount: '+12.45', risk: 'low', time: '12s' },
  { id: '2', address: '0x1d8f...4e7a', token: 'USDC', amount: '-250.00', risk: 'low', time: '45s' },
  { id: '3', address: '0x9e4c...2b11', token: 'BONK', amount: '+50000', risk: 'medium', time: '2m' },
  { id: '4', address: '0x3f7a...8d33', token: 'JUP', amount: '-1,200', risk: 'high', time: '5m' },
  { id: '5', address: '0x6b2d...c5ee', token: 'SOL', amount: '+8.20', risk: 'low', time: '8m' },
  { id: '6', address: '0x2e9a...1f44', token: 'PYTH', amount: '+340', risk: 'medium', time: '12m' },
];

const riskColors = {
  low: theme.green,
  medium: theme.amber,
  high: theme.red,
};

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(200 + index * 60).duration(400)}>
      <AnimatedTouchable
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        style={[
          styles.txRow,
          animatedStyle,
        ]}
        activeOpacity={1}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={[
              styles.riskDot,
              { backgroundColor: riskColors[tx.risk] },
            ]}
          />
          <Text style={styles.txAddress}>{tx.address}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.txToken}>{tx.token}</Text>
          <Text style={[styles.txAmount, { color: tx.amount.startsWith('+') ? theme.accent : theme.warning }]}>
            {tx.amount}
          </Text>
          <Text style={styles.txTime}>{tx.time}</Text>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [spendPercent, setSpendPercent] = useState(0);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      setSpendPercent(0.62);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  }, [scrollY]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <TerminalLoader dots={5} />
          <Text style={styles.loadingText}>SYNCING WALLET</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>DISCFI</Text>
          <FloatingPill label="INTENTS ACTIVE" count={4} />
        </View>

        <View style={styles.vitalsRow}>
          <Animated.View
            entering={FadeInUp.duration(500).delay(100)}
            style={[styles.vitalsCard, { flex: 2, marginRight: 4 }]}
          >
            <Text style={styles.vitalsLabel}>TODAY'S SPEND</Text>
            <Text style={styles.vitalsValue}>$247.80</Text>
            <Text style={styles.vitalsSub}>+12.4% vs avg</Text>
          </Animated.View>
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            style={[styles.vitalsCard, { flex: 1, marginLeft: 4 }]}
          >
            <Text style={styles.vitalsLabel}>ACTIVE</Text>
            <Text style={[styles.vitalsValue, { fontSize: 28 }]}>4</Text>
            <Text style={styles.vitalsSub}>rules</Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
        >
          <RadialGauge value={0.28} size={100} label="RISK SCORE" />
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SPENDING LIMIT</Text>
          <Text style={styles.sectionSub}>$5,000 / $8,000</Text>
        </View>
        <Animated.View
          entering={FadeInUp.duration(500).delay(350)}
          style={{ marginHorizontal: spacing.lg, marginBottom: spacing.xxl }}
        >
          <EKGBar value={spendPercent} height={40} />
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
        </View>

        <View style={styles.txList}>
          {MOCK_TX.map((tx, i) => (
            <TransactionRow key={tx.id} tx={tx} index={i} />
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeIn.duration(600).delay(800)}
        style={styles.simulateBtnContainer}
      >
        <TouchableOpacity style={styles.simulateBtn} activeOpacity={0.85}>
          <Text style={styles.simulateBtnText}>SIMULATE TX</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontFamily: theme.fontMono,
    fontSize: 11,
    color: theme.muted,
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: theme.fontDisplay,
    fontSize: 28,
    color: theme.text,
    letterSpacing: 1,
  },
  vitalsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  vitalsCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.lg,
    borderRadius: 0,
  },
  vitalsLabel: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  vitalsValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 24,
    color: theme.text,
    marginBottom: 2,
  },
  vitalsSub: {
    fontFamily: theme.fontMono,
    fontSize: 10,
    color: theme.mutedLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: theme.fontBody,
    fontSize: 11,
    color: theme.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionSub: {
    fontFamily: theme.fontMono,
    fontSize: 12,
    color: theme.textDim,
  },
  txList: {
    paddingHorizontal: spacing.lg,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    marginRight: spacing.sm,
  },
  txAddress: {
    fontFamily: theme.fontMono,
    fontSize: 12,
    color: theme.textDim,
  },
  txToken: {
    fontFamily: theme.fontMono,
    fontSize: 10,
    color: theme.mutedLight,
    marginRight: 2,
  },
  txAmount: {
    fontFamily: theme.fontMonoBold,
    fontSize: 13,
  },
  txTime: {
    fontFamily: theme.fontMono,
    fontSize: 10,
    color: theme.muted,
  },
  simulateBtnContainer: {
    position: 'absolute',
    bottom: 30,
    left: spacing.lg,
    right: spacing.lg,
  },
  simulateBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 0,
  },
  simulateBtnText: {
    fontFamily: theme.fontMonoBold,
    fontSize: 14,
    color: theme.bg,
    letterSpacing: 2,
  },
});
