import { useState, useMemo, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Connection, PublicKey } from '@solana/web3.js';
import { T, formatCurrency } from '../theme';
import { VaultIcon, PercentIcon, ArrowUpIcon, HistoryIcon } from '../components/Icons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { getRules } from '../services/secureStorage';
import { fetchSOLBalance } from '../services/walletDataService';
import { DEFAULT_RULES } from '../services/types';

function Sparkline({ data, width = 300, height = 80 }: { data: number[]; width?: number; height?: number }) {
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
        <LinearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={T.accent} stopOpacity="0.3" />
          <Stop offset="1" stopColor={T.accent} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {path && (
        <>
          <Path d={path.area} fill="url(#vaultGrad)" />
          <Path d={path.line} stroke={T.accent} strokeWidth={2} fill="none" />
        </>
      )}
    </Svg>
  );
}

export default function VaultScreen() {
  const { vaultAddress, vaultPublicKey } = useWallet();
  const { connection } = useNetwork();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoSavePct, setAutoSavePct] = useState(15);

  useEffect(() => {
    (async () => {
      if (!vaultPublicKey) {
        setLoading(false);
        return;
      }
      try {
        const sol = await fetchSOLBalance(connection, vaultPublicKey);
        setBalance(sol);
      } catch {
        setBalance(0);
      }
      setLoading(false);
    })();
  }, [vaultPublicKey, connection]);

  useEffect(() => {
    (async () => {
      const rules = await getRules();
      if (rules) setAutoSavePct(rules.autoSavePct);
    })();
  }, []);

  const mockSparklineData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => 0.5 + Math.sin(i * 0.3) * 0.2 + Math.random() * 0.1),
  []);

  const hasVault = vaultAddress.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: T.s5 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <VaultIcon size={22} color={T.accentLight} />
          </View>
          <Text style={styles.title}>Reserve</Text>
        </View>
        <Text style={styles.subtitle}>Your savings vault</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceGlow} />
        <Text style={styles.balanceLabel}>Vault Balance</Text>
        {loading ? (
          <ActivityIndicator color={T.accent} style={{ marginVertical: 20 }} />
        ) : (
          <Text style={styles.balanceValue}>{balance.toFixed(4)} SOL</Text>
        )}
        <View style={styles.balanceRow}>
          <View style={styles.changeBadge}>
            <ArrowUpIcon size={12} color={T.safe} />
            <Text style={styles.changeText}>Auto-save active</Text>
          </View>
          <Text style={styles.denom}>SOL</Text>
        </View>
      </View>

      {/* Auto-Save Card */}
      <View style={styles.autoSaveCard}>
        <View style={styles.autoSaveHeader}>
          <View style={styles.autoSaveIcon}>
            <PercentIcon size={18} color={T.safe} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.autoSaveTitle}>Auto-Covenant</Text>
            <Text style={styles.autoSaveDesc}>{autoSavePct}% of all incoming → Vault</Text>
          </View>
          <Text style={styles.autoSavePct}>{autoSavePct}%</Text>
        </View>
        <View style={styles.autoSaveDivider} />
        <View style={styles.autoSaveFooter}>
          <HistoryIcon size={14} color={T.inkMuted} />
          <Text style={styles.autoSaveTrigger}>Next trigger: on next deposit</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>30-Day History</Text>
        </View>
        <View style={styles.chartContainer}>
          <Sparkline data={mockSparklineData} width={280} height={80} />
        </View>
      </View>

      {/* Vault Address */}
      <View style={styles.addressCard}>
        <Text style={styles.addressLabel}>Vault Address</Text>
        <Text style={styles.addressValue} numberOfLines={1}>
          {hasVault ? vaultAddress : 'No vault configured'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: T.s4, paddingTop: 56, marginBottom: T.s5 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: T.s3, marginBottom: T.s1 },
  headerIcon: { width: 36, height: 36, borderRadius: T.radiusFull, backgroundColor: T.accent + '20', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: T.fontBold, fontSize: 28, color: T.ink, letterSpacing: -0.5 },
  subtitle: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkMuted, marginLeft: 44 },
  balanceCard: { marginHorizontal: T.s4, padding: T.s5, borderRadius: T.radius, backgroundColor: T.surface, position: 'relative', overflow: 'hidden', marginBottom: T.s5 },
  balanceGlow: { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: T.accent, opacity: 0.06 },
  balanceLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted, marginBottom: T.s1 },
  balanceValue: { fontFamily: T.fontBold, fontSize: 44, color: T.ink, letterSpacing: -1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: T.s2, marginTop: T.s2 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: T.s1, backgroundColor: T.safe + '20', paddingHorizontal: T.s2, paddingVertical: T.s1, borderRadius: T.radiusFull },
  changeText: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.safe },
  denom: { fontFamily: T.fontSemiBold, fontSize: 12, color: T.inkMuted },
  autoSaveCard: { marginHorizontal: T.s4, backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5, borderWidth: 1, borderColor: T.safe + '20' },
  autoSaveHeader: { flexDirection: 'row', alignItems: 'center', gap: T.s3 },
  autoSaveIcon: { width: 40, height: 40, borderRadius: T.radiusFull, backgroundColor: T.safe + '20', alignItems: 'center', justifyContent: 'center' },
  autoSaveTitle: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  autoSaveDesc: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted, marginTop: T.s1 },
  autoSavePct: { fontFamily: T.fontBold, fontSize: 24, color: T.safe, letterSpacing: -0.5 },
  autoSaveDivider: { height: T.hairline, backgroundColor: T.border, marginVertical: T.s3 },
  autoSaveFooter: { flexDirection: 'row', alignItems: 'center', gap: T.s2 },
  autoSaveTrigger: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted },
  chartSection: { marginHorizontal: T.s4, backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  chartHeader: { marginBottom: T.s2 },
  chartTitle: { fontFamily: T.fontSemiBold, fontSize: 14, color: T.ink },
  chartContainer: { alignItems: 'center' },
  addressCard: { marginHorizontal: T.s4, backgroundColor: T.surface, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  addressLabel: { fontFamily: T.fontFamily, fontSize: 12, color: T.inkMuted, marginBottom: T.s1 },
  addressValue: { fontFamily: T.fontMono || T.fontFamily, fontSize: 12, color: T.ink, letterSpacing: 0.3 },
});
