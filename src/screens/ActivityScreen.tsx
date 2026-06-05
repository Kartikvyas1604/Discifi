import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { T, formatCompact } from '../theme';
import { CloseIcon, ArrowUpIcon, ArrowDownIcon, SparklesIcon, SearchIcon, ZapIcon } from '../components/Icons';

interface Tx {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'approve';
  protocol: string;
  amount: number;
  usdValue: number;
  date: string;
  token: string;
  status: 'confirmed' | 'pending' | 'failed';
}

const ALL_TXS: Tx[] = [
  { id: '1', type: 'swap', protocol: 'Jupiter DEX', amount: 1240, usdValue: 1240, date: 'Today, 12:30 PM', token: 'USDC', status: 'confirmed' },
  { id: '2', type: 'receive', protocol: 'Coinbase', amount: 500, usdValue: 500, date: 'Today, 11:15 AM', token: 'USDC', status: 'confirmed' },
  { id: '3', type: 'send', protocol: 'Magic Eden', amount: 0.5, usdValue: 80, date: 'Today, 9:00 AM', token: 'SOL', status: 'confirmed' },
  { id: '4', type: 'swap', protocol: 'Orca LP', amount: 2450, usdValue: 2450, date: 'Yesterday, 4:20 PM', token: 'USDC', status: 'confirmed' },
  { id: '5', type: 'receive', protocol: 'Solend', amount: 1200, usdValue: 1200, date: 'Yesterday, 8:00 AM', token: 'USDC', status: 'confirmed' },
  { id: '6', type: 'send', protocol: 'Drift Protocol', amount: 1.2, usdValue: 240, date: '2 days ago', token: 'SOL', status: 'confirmed' },
  { id: '7', type: 'swap', protocol: 'Kamino Earn', amount: 2000, usdValue: 2000, date: '2 days ago', token: 'USDC', status: 'confirmed' },
  { id: '8', type: 'approve', protocol: 'Sanctum', amount: 0, usdValue: 0, date: '3 days ago', token: '', status: 'confirmed' },
  { id: '9', type: 'receive', protocol: 'Meteora DLMM', amount: 150, usdValue: 150, date: '3 days ago', token: 'USDC', status: 'pending' },
  { id: '10', type: 'send', protocol: 'Sanctum', amount: 100, usdValue: 100, date: '4 days ago', token: 'USDC', status: 'failed' },
];

type Filter = 'all' | 'send' | 'receive' | 'swap';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'send', label: 'Sent' },
  { key: 'receive', label: 'Received' },
  { key: 'swap', label: 'Swaps' },
];

export default function ActivityScreen({ navigation }: any) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  const filtered = ALL_TXS.filter((tx) => {
    if (activeFilter === 'all') return true;
    return tx.type === activeFilter;
  });

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'receive': return { icon: ArrowDownIcon, color: T.safe, bg: T.safe + '20' };
      case 'send': return { icon: ArrowUpIcon, color: T.danger, bg: T.danger + '20' };
      case 'swap': return { icon: SparklesIcon, color: T.accentLight, bg: T.accent + '20' };
      case 'approve': return { icon: ZapIcon, color: T.warning, bg: T.warning + '20' };
      default: return { icon: ArrowUpIcon, color: T.inkMuted, bg: T.surfaceElevated };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <SearchIcon size={22} color={T.inkMuted} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: T.s4, gap: T.s2 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filtered.map((tx, i) => {
            const { icon: Icon, color, bg } = getTxIcon(tx.type);
            const isLast = i === filtered.length - 1;

            return (
              <TouchableOpacity
                key={tx.id}
                style={[styles.txRow, isLast && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
              >
                <View style={[styles.txIcon, { backgroundColor: bg }]}>
                  <Icon size={14} color={color} />
                </View>

                <View style={styles.txInfo}>
                  <View style={styles.txTop}>
                    <Text style={styles.txProtocol}>{tx.protocol}</Text>
                    {tx.status === 'pending' && <Text style={styles.pendingBadge}>Pending</Text>}
                    {tx.status === 'failed' && <Text style={styles.failedBadge}>Failed</Text>}
                  </View>
                  <Text style={styles.txDate}>{tx.date}</Text>
                </View>

                {tx.type !== 'approve' && (
                  <View style={styles.txAmountCol}>
                    <Text style={[styles.txValue, { color: tx.type === 'receive' ? T.safe : T.ink }]}>
                      {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}{tx.amount} {tx.token}
                    </Text>
                    {tx.usdValue > 0 && (
                      <Text style={styles.txUsd}>${formatCompact(tx.usdValue)}</Text>
                    )}
                  </View>
                )}
                {tx.type === 'approve' && (
                  <View style={styles.txAmountCol}>
                    <Text style={styles.approveLabel}>Approved</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
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
  headerTitle: {
    fontFamily: T.fontBold,
    fontSize: 18,
    color: T.ink,
  },
  filterRow: {
    maxHeight: 44,
    marginBottom: T.s3,
  },
  filterChip: {
    paddingHorizontal: T.s4,
    paddingVertical: T.s2,
    borderRadius: T.radiusFull,
    backgroundColor: T.surface,
  },
  filterChipActive: {
    backgroundColor: T.accent,
  },
  filterText: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  filterTextActive: {
    color: T.ink,
    fontFamily: T.fontSemiBold,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: T.s3,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: T.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: T.s3,
  },
  txTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s2,
  },
  txProtocol: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.ink,
  },
  pendingBadge: {
    fontFamily: T.fontFamily,
    fontSize: 10,
    color: T.warning,
    backgroundColor: T.warning + '20',
    paddingHorizontal: T.s1,
    paddingVertical: 1,
    borderRadius: T.radiusSm - 4,
    overflow: 'hidden',
  },
  failedBadge: {
    fontFamily: T.fontFamily,
    fontSize: 10,
    color: T.danger,
    backgroundColor: T.danger + '20',
    paddingHorizontal: T.s1,
    paddingVertical: 1,
    borderRadius: T.radiusSm - 4,
    overflow: 'hidden',
  },
  txDate: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
  },
  txUsd: {
    fontFamily: T.fontFamily,
    fontSize: 11,
    color: T.inkMuted,
    marginTop: 1,
  },
  approveLabel: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: T.s8,
  },
  emptyText: {
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.inkFaint,
  },
});
