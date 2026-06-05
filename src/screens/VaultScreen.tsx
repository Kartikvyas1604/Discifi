import { useState, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { T, formatCurrency } from '../theme';

function Sparkline({ data, width = 300, height = 64 }: { data: number[]; width?: number; height?: number }) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    const points = data.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 8) - 4,
    }));

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const area = d + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return { line: d, area };
  }, [data, width, height]);

  return (
    <View style={{ alignItems: 'center', marginVertical: T.s4 }}>
      <Svg width={width} height={height}>
        {path && (
          <>
            <Path d={path.area} fill={T.gold} opacity={0.06} />
            <Path d={path.line} stroke={T.gold} strokeWidth={1.5} fill="none" />
          </>
        )}
      </Svg>
    </View>
  );
}

const mockSparklineData = Array.from({ length: 60 }, (_, i) =>
  4000 + Math.sin(i * 0.4) * 600 + Math.random() * 200 + i * 15,
);

export default function VaultScreen() {
  const [balance] = useState(4218.50);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100, alignItems: 'center' }}
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>~/reserve</Text>
      </View>

      <Text style={styles.title}>THE RESERVE</Text>

      <View style={styles.titleRule} />

      <Text style={styles.balance}>${formatCurrency(balance)}</Text>
      <Text style={styles.denomination}>USDC</Text>

      <View style={styles.autoSaveCard}>
        <View style={styles.autoSaveHeader}>
          <Text style={styles.autoSaveLabel}>AUTO-COVENANT</Text>
          <Text style={styles.autoSavePct}>15%</Text>
        </View>
        <Text style={styles.autoSaveDesc}>of all incoming → USDC</Text>
        <View style={styles.autoSaveDivider} />
        <Text style={styles.autoSaveTrigger}>Next trigger: on deposit</Text>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartLabel}>60-DAY HISTORY</Text>
        <Sparkline data={mockSparklineData} width={280} height={64} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MONTH</Text>
          <Text style={styles.statValue}>$1,240</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>AVG/DAY</Text>
          <Text style={styles.statValue}>$41.33</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statValue}>23d</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.7}>
        <Text style={styles.withdrawText}>WITHDRAW</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    width: '100%',
    paddingHorizontal: T.s4,
    paddingTop: 60,
    marginBottom: T.s2,
  },
  headerLabel: {
    fontFamily: T.fontMono,
    fontSize: 11,
    color: T.gold,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: T.fontDisplay,
    fontSize: 32,
    color: T.ink,
    textAlign: 'center',
    marginBottom: T.s2,
  },
  titleRule: {
    width: 40,
    height: 1,
    backgroundColor: T.gold,
    marginBottom: T.s5,
  },
  balance: {
    fontFamily: T.fontFigures,
    fontSize: 64,
    color: T.ink,
    textAlign: 'center',
    lineHeight: 68,
  },
  denomination: {
    fontFamily: T.fontBody,
    fontSize: 11,
    letterSpacing: 2,
    color: T.gold,
    textAlign: 'center',
    marginBottom: T.s6,
  },
  autoSaveCard: {
    width: '85%',
    borderWidth: T.hairline,
    borderColor: T.border,
    padding: T.s4,
    marginBottom: T.s5,
  },
  autoSaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.s1,
  },
  autoSaveLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
  },
  autoSavePct: {
    fontFamily: T.fontFigures,
    fontSize: 18,
    color: T.gold,
  },
  autoSaveDesc: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.ink,
    marginBottom: T.s2,
  },
  autoSaveDivider: {
    height: T.hairline,
    backgroundColor: T.border,
    marginBottom: T.s2,
  },
  autoSaveTrigger: {
    fontFamily: T.fontMono,
    fontSize: 10,
    color: T.inkMuted,
  },
  chartSection: {
    width: '100%',
    paddingHorizontal: T.s4,
    marginBottom: T.s5,
  },
  chartLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
    textAlign: 'center',
    marginBottom: T.s2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: T.s2,
    paddingHorizontal: T.s4,
    marginBottom: T.s6,
  },
  statBox: {
    flex: 1,
    backgroundColor: T.surface,
    borderWidth: T.hairline,
    borderColor: T.border,
    padding: T.s3,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: T.fontBody,
    fontSize: 8,
    letterSpacing: 1.5,
    color: T.inkMuted,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: T.fontBody,
    fontSize: 14,
    color: T.ink,
  },
  withdrawBtn: {
    width: '85%',
    borderWidth: 1,
    borderColor: T.ink,
    paddingVertical: T.s4,
    alignItems: 'center',
  },
  withdrawText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.ink,
    letterSpacing: 2,
  },
});
