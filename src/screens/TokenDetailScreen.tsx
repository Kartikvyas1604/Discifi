import { useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { T, formatCurrency, formatCompact } from '../theme';
import { ChevronLeftIcon, ArrowUpIcon, ArrowDownIcon, SwapIcon, HistoryIcon, SparklesIcon } from '../components/Icons';

function Sparkline({ data, width = 320, height = 160, color = T.safe }: { data: number[]; width?: number; height?: number; color?: string }) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const points = data.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 16) - 8,
    }));
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = line + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    return { line, area };
  }, [data, width, height]);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.15" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {path && (
        <>
          <Path d={path.area} fill="url(#sparkGrad)" />
          <Path d={path.line} stroke={color} strokeWidth={2} fill="none" />
        </>
      )}
    </Svg>
  );
}

const HOURS = ['1H', '24H', '7D', '30D', '1Y', 'ALL'];

export default function TokenDetailScreen({ navigation, route }: any) {
  const { symbol, name, color: tokenColor, value, change24h } = route?.params || {};
  const mockData = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i * 0.3) * 20 + Math.random() * 10 + i * 0.3),
  []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeftIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerSymbol}>{symbol || 'SOL'}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: T.s5 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Price */}
        <View style={styles.priceSection}>
          <Text style={styles.priceValue}>${formatCurrency(value || 199.47)}</Text>
          <View style={styles.priceChangeRow}>
            <View style={[styles.changeBadge, { backgroundColor: (change24h || 3.2) >= 0 ? T.safe + '20' : T.danger + '20' }]}>
              <ArrowUpIcon size={12} color={(change24h || 3.2) >= 0 ? T.safe : T.danger} />
              <Text style={[styles.changeText, { color: (change24h || 3.2) >= 0 ? T.safe : T.danger }]}>
                {(change24h || 3.2) >= 0 ? '+' : ''}{change24h || 3.2}%
              </Text>
            </View>
            <Text style={styles.changeLabel}>Past 24 hours</Text>
          </View>
        </View>

        {/* Timeframe selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeframeRow} contentContainerStyle={{ gap: T.s1 }}>
          {HOURS.map((h) => (
            <TouchableOpacity key={h} style={[styles.timeChip, h === '24H' && styles.timeChipActive]} activeOpacity={0.7}>
              <Text style={[styles.timeText, h === '24H' && styles.timeTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Sparkline data={mockData} width={320} height={160} color={(change24h || 3.2) >= 0 ? T.safe : T.danger} />
        </View>

        {/* Quick Actions */}
        <View style={styles.tokenActions}>
          <TouchableOpacity style={styles.tokenAction} activeOpacity={0.8}>
            <View style={[styles.tokenActionIcon, { backgroundColor: T.accent + '20' }]}>
              <ArrowUpIcon size={20} color={T.accentLight} />
            </View>
            <Text style={styles.tokenActionLabel}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tokenAction} activeOpacity={0.8}>
            <View style={[styles.tokenActionIcon, { backgroundColor: T.safe + '20' }]}>
              <ArrowDownIcon size={20} color={T.safe} />
            </View>
            <Text style={styles.tokenActionLabel}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tokenAction} activeOpacity={0.8}>
            <View style={[styles.tokenActionIcon, { backgroundColor: '#FFD60A20' }]}>
              <SwapIcon size={18} color={T.warning} />
            </View>
            <Text style={styles.tokenActionLabel}>Swap</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Token Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{name || 'Solana'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Symbol</Text>
              <Text style={styles.infoValue}>{symbol || 'SOL'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Price</Text>
              <Text style={styles.infoValue}>${formatCurrency(value || 199.47)}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Market Cap</Text>
              <Text style={styles.infoValue}>$92.4B</Text>
            </View>
          </View>
        </View>

        {/* Recent transactions for this token */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>
          {[
            { type: 'send' as const, protocol: 'Drift Protocol', amount: '1.2 SOL', usd: '$240', date: '1d ago' },
            { type: 'receive' as const, protocol: 'Coinbase', amount: '5 SOL', usd: '$997', date: '3d ago' },
            { type: 'swap' as const, protocol: 'Jupiter', amount: '→ 842 USDC', usd: '$842', date: '5d ago' },
          ].map((tx, i) => (
            <TouchableOpacity key={i} style={styles.txRow} activeOpacity={0.7}>
              <View style={[styles.txIcon, {
                backgroundColor: tx.type === 'receive' ? T.safe + '20' : tx.type === 'send' ? T.danger + '20' : T.accent + '20'
              }]}>
                {tx.type === 'receive' ? <ArrowDownIcon size={14} color={T.safe} /> :
                 tx.type === 'send' ? <ArrowUpIcon size={14} color={T.danger} /> :
                 <SparklesIcon size={12} color={T.accentLight} />}
              </View>
              <View style={{ flex: 1, marginLeft: T.s3 }}>
                <Text style={styles.txProtocol}>{tx.protocol}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txAmount, { color: tx.type === 'receive' ? T.safe : T.ink }]}>
                  {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.amount}
                </Text>
                <Text style={styles.txUsd}>{tx.usd}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: T.s4,
    paddingTop: 56,
    paddingBottom: T.s4,
  },
  headerSymbol: {
    fontFamily: T.fontBold,
    fontSize: 18,
    color: T.ink,
  },
  priceSection: {
    alignItems: 'center',
    paddingVertical: T.s5,
  },
  priceValue: {
    fontFamily: T.fontBold,
    fontSize: 44,
    color: T.ink,
    letterSpacing: -1,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s2,
    marginTop: T.s2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s1,
    paddingHorizontal: T.s2,
    paddingVertical: T.s1,
    borderRadius: T.radiusFull,
  },
  changeText: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
  },
  changeLabel: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  timeframeRow: {
    maxHeight: 36,
    paddingHorizontal: T.s4,
    marginBottom: T.s3,
  },
  timeChip: {
    paddingHorizontal: T.s3,
    paddingVertical: T.s1,
    borderRadius: T.radiusFull,
    backgroundColor: T.surface,
  },
  timeChipActive: {
    backgroundColor: T.accent,
  },
  timeText: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  timeTextActive: {
    color: T.ink,
    fontFamily: T.fontSemiBold,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: T.s5,
    paddingHorizontal: T.s4,
  },
  tokenActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: T.s6,
    paddingVertical: T.s4,
    marginBottom: T.s5,
  },
  tokenAction: {
    alignItems: 'center',
    gap: T.s2,
  },
  tokenActionIcon: {
    width: 48,
    height: 48,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenActionLabel: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  infoSection: {
    paddingHorizontal: T.s4,
    marginBottom: T.s5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: T.s2,
  },
  sectionTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 16,
    color: T.ink,
    marginBottom: T.s2,
  },
  viewAll: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.accent,
  },
  infoCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: T.s2,
  },
  infoLabel: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  infoValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
    color: T.ink,
  },
  infoDivider: {
    height: T.hairline,
    backgroundColor: T.border,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.s3,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txProtocol: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.ink,
  },
  txDate: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: T.s1,
  },
  txAmount: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
  },
  txUsd: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: T.s1,
  },
});
