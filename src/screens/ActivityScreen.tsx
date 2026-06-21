import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';
import { T, formatCompact } from '../theme';
import { CloseIcon, ArrowUpIcon, ArrowDownIcon, SparklesIcon, SearchIcon, ZapIcon } from '../components/Icons';
import { useWallet } from '../services/WalletContext';
import { useNetwork } from '../services/NetworkContext';
import { useWalletData } from '../services/useWalletData';

type Filter = 'all' | 'send' | 'receive' | 'swap';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'send', label: 'Sent' },
  { key: 'receive', label: 'Received' },
  { key: 'swap', label: 'Swaps' },
];

export default function ActivityScreen({ navigation }: any) {
  const { hotPublicKey } = useWallet();
  const { network, explorerUrl } = useNetwork();
  const { transactions } = useWalletData(hotPublicKey);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const filtered = transactions.filter((tx) => {
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

  const openExplorer = (signature: string) => {
    const url = `${explorerUrl}/tx/${signature}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <CloseIcon size={24} color={T.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 24 }} />
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
        contentContainerStyle={{ paddingHorizontal: T.s4, paddingBottom: T.s5 }}
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
                key={tx.signature || i}
                style={[styles.txRow, isLast && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => setSelectedTx(tx)}
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
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Transaction Detail Modal */}
      <Modal visible={!!selectedTx} transparent animationType="slide" onRequestClose={() => setSelectedTx(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedTx(null)} activeOpacity={0.7}>
              <CloseIcon size={20} color={T.ink} />
            </TouchableOpacity>

            {selectedTx && (
              <>
                <Text style={styles.modalTitle}>Transaction Details</Text>

                <View style={styles.modalDetailCard}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status</Text>
                    <Text style={[styles.modalDetailValue, {
                      color: selectedTx.status === 'confirmed' ? T.safe : selectedTx.status === 'failed' ? T.danger : T.warning
                    }]}>
                      {selectedTx.status}
                    </Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Type</Text>
                    <Text style={styles.modalDetailValue}>{selectedTx.type}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Protocol</Text>
                    <Text style={styles.modalDetailValue}>{selectedTx.protocol}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Amount</Text>
                    <Text style={styles.modalDetailValue}>{selectedTx.amount} {selectedTx.token}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Fee</Text>
                    <Text style={styles.modalDetailValue}>{(selectedTx.fee / 1e9).toFixed(6)} SOL</Text>
                  </View>
                  <View style={styles.modalDivider} />
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Signature</Text>
                    <Text style={[styles.modalDetailValue, { fontSize: 11 }]} numberOfLines={1}>
                      {selectedTx.signature}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.explorerBtn} onPress={() => openExplorer(selectedTx.signature)} activeOpacity={0.8}>
                  <Text style={styles.explorerText}>View on Solana Explorer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: T.s4, paddingTop: 56, paddingBottom: T.s4 },
  headerTitle: { fontFamily: T.fontBold, fontSize: 18, color: T.ink },
  filterRow: { maxHeight: 44, marginBottom: T.s3 },
  filterChip: { paddingHorizontal: T.s4, paddingVertical: T.s2, borderRadius: T.radiusFull, backgroundColor: T.surface },
  filterChipActive: { backgroundColor: T.accent },
  filterText: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  filterTextActive: { color: T.ink, fontFamily: T.fontSemiBold },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: T.s3, borderBottomWidth: T.hairline, borderBottomColor: T.border },
  txIcon: { width: 40, height: 40, borderRadius: T.radiusFull, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: T.s3 },
  txTop: { flexDirection: 'row', alignItems: 'center', gap: T.s2 },
  txProtocol: { fontFamily: T.fontFamily, fontSize: 14, color: T.ink },
  pendingBadge: { fontFamily: T.fontFamily, fontSize: 10, color: T.warning, backgroundColor: T.warning + '20', paddingHorizontal: T.s1, paddingVertical: T.s1, borderRadius: T.s1, overflow: 'hidden' },
  failedBadge: { fontFamily: T.fontFamily, fontSize: 10, color: T.danger, backgroundColor: T.danger + '20', paddingHorizontal: T.s1, paddingVertical: T.s1, borderRadius: T.s1, overflow: 'hidden' },
  txDate: { fontFamily: T.fontFamily, fontSize: 11, color: T.inkMuted, marginTop: T.s1 },
  txAmountCol: { alignItems: 'flex-end' },
  txValue: { fontFamily: T.fontSemiBold, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: T.s8 },
  emptyText: { fontFamily: T.fontFamily, fontSize: 15, color: T.inkFaint },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: T.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: T.s5, paddingBottom: T.s7 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.surfaceElevated, alignSelf: 'center', marginBottom: T.s5 },
  modalClose: { position: 'absolute', top: T.s4, right: T.s4, zIndex: 1 },
  modalTitle: { fontFamily: T.fontBold, fontSize: 20, color: T.ink, marginBottom: T.s5, letterSpacing: -0.3 },
  modalDetailCard: { backgroundColor: T.bg, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5 },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: T.s2 },
  modalDetailLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  modalDetailValue: { fontFamily: T.fontSemiBold, fontSize: 13, color: T.ink, maxWidth: '60%', textAlign: 'right' },
  modalDivider: { height: T.hairline, backgroundColor: T.border },
  explorerBtn: { backgroundColor: T.accent, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center' },
  explorerText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
});
