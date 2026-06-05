import { useEffect, useMemo } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { theme, spacing } from '../theme';

function FlowDiagram() {
  const cx1 = 40;
  const cy1 = 24;
  const cx2 = 120;
  const cy2 = 24;
  const r = 16;

  return (
    <Svg width={160} height={48} style={{ marginVertical: spacing.md }}>
      <Circle cx={cx1} cy={cy1} r={r} fill="none" stroke={theme.accent} strokeWidth={1.5} />
      <Text
        style={{
          position: 'absolute',
          top: cy1 - 4,
          left: cx1 - 5,
          fontFamily: theme.fontMono,
          fontSize: 7,
          color: theme.accent,
        }}
      />
      <Line x1={cx1 + r + 4} y1={cy1} x2={cx2 - r - 4} y2={cy2} stroke={theme.accent} strokeWidth={1} />
      <Line x1={cx2 - r - 8} y1={cy2 - 4} x2={cx2 - r - 4} y2={cy2} stroke={theme.accent} strokeWidth={1} />
      <Line x1={cx2 - r - 8} y1={cy2 + 4} x2={cx2 - r - 4} y2={cy2} stroke={theme.accent} strokeWidth={1} />
      <Circle cx={cx2} cy={cy2} r={r} fill="none" stroke={theme.accent} strokeWidth={1.5} />
    </Svg>
  );
}

function Sparkline({ data, color = theme.accent }: { data: number[]; color?: string }) {
  const width = 300;
  const height = 48;

  const path = useMemo(() => {
    if (data.length < 2) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    const points = data.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 4) - 2,
    }));

    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [data, width, height]);

  return (
    <Svg width={width} height={height}>
      <Path d={path} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

const mockSparklineData = Array.from({ length: 30 }, (_, i) =>
  10000 + Math.sin(i * 0.5) * 2000 + Math.random() * 1000 + i * 150,
);

export default function VaultScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>~/vault</Text>
      </View>

      <Animated.View entering={FadeInUp.duration(600).delay(100)}>
        <Text style={styles.vaultTitle}>VAULT</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>TOTAL SAVED</Text>
        <Text style={styles.balanceValue}>$12,847.62</Text>
        <Text style={styles.balanceEquivalent}>24.5 SOL · 8,420 USDC</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.autoSaveSection}>
        <Text style={styles.sectionLabel}>AUTO-SAVE RULE</Text>
        <Text style={styles.autoSavePercent}>15% of incoming → stablecoin</Text>
        <FlowDiagram />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.graphSection}>
        <Text style={styles.sectionLabel}>30-DAY HISTORY</Text>
        <Sparkline data={mockSparklineData} color={theme.accent} />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>SAVED THIS MONTH</Text>
          <Text style={styles.statValue}>$1,240</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AVG. DAILY</Text>
          <Text style={styles.statValue}>$41.33</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statValue}>23 days</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(600).delay(600)} style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
        <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.85}>
          <Text style={styles.withdrawBtnText}>WITHDRAW</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  headerLabel: {
    fontFamily: theme.fontMono,
    fontSize: 13,
    color: theme.accent,
    letterSpacing: 0.5,
  },
  vaultTitle: {
    fontFamily: theme.fontDisplay,
    fontSize: 72,
    color: theme.text,
    letterSpacing: 2,
    paddingHorizontal: spacing.lg,
    lineHeight: 76,
    marginBottom: spacing.xxl,
  },
  balanceSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  balanceLabel: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  balanceValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 40,
    color: theme.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  balanceEquivalent: {
    fontFamily: theme.fontMono,
    fontSize: 11,
    color: theme.textDim,
  },
  autoSaveSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  autoSavePercent: {
    fontFamily: theme.fontMonoBold,
    fontSize: 16,
    color: theme.accent,
  },
  graphSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.md,
  },
  statLabel: {
    fontFamily: theme.fontBody,
    fontSize: 8,
    color: theme.muted,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 14,
    color: theme.text,
  },
  withdrawBtn: {
    borderWidth: 1,
    borderColor: theme.accent,
    paddingVertical: 18,
    alignItems: 'center',
  },
  withdrawBtnText: {
    fontFamily: theme.fontMonoBold,
    fontSize: 13,
    color: theme.accent,
    letterSpacing: 2,
  },
});
