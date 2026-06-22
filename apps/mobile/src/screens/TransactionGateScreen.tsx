import { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  type ViewStyle,
} from 'react-native';
import { T } from '../theme';
import { AlertIcon, CheckIcon, CloseIcon } from '../components/Icons';
import { checkAllRules } from '../services/ruleEngine';
import { getRules } from '../services/secureStorage';
import type { RuleConfig, Network } from '../services/types';

function FadeInView({
  delay = 0,
  duration = 240,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

interface EvidenceRow {
  label: string;
  value: string;
  color: string;
}

function EvidenceList({ items }: { items: EvidenceRow[] }) {
  return (
    <View style={styles.evidenceList}>
      {items.map((item, i) => (
        <View key={i} style={styles.evidenceRow}>
          <Text style={styles.evidenceLabel}>{item.label}</Text>
          <View style={[styles.evidenceDot, { backgroundColor: item.color }]} />
          <Text style={[styles.evidenceValue, { color: item.color }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

interface TransactionGateScreenProps {
  visible: boolean;
  onClose: () => void;
  onApprove?: () => void;
  amount?: number;
  destination?: string;
  token?: string;
  network?: Network;
}

export default function TransactionGateScreen({ visible, onClose, onApprove, amount = 0, destination = '', token = 'SOL', network = 'devnet' }: TransactionGateScreenProps) {
  const [resolved, setResolved] = useState<'rejected' | 'approved' | null>(null);
  const [riskFactors, setRiskFactors] = useState<EvidenceRow[]>([]);

  useEffect(() => {
    setResolved(null);
    if (visible) {
      (async () => {
        const rules = await getRules();
        const cfg = rules || {} as RuleConfig;
        const results = await checkAllRules(cfg, amount, destination, 'send');
        const items: EvidenceRow[] = [];
        if (!results.dailyLimit) items.push({ label: 'Daily Limit', value: `Exceeds $${cfg.dailyLimit?.toLocaleString() || '800'}`, color: T.danger });
        if (!results.perTxLimit) items.push({ label: 'Per-Tx Limit', value: `Exceeds $${cfg.perTxLimit?.toLocaleString() || '500'}`, color: T.danger });
        if (!results.newAddress) items.push({ label: 'New Address', value: 'First transaction to this address', color: T.warning });
        if (!results.velocity) items.push({ label: 'Velocity', value: `Exceeds ${cfg.velocityLimit || '10'} tx/hr`, color: T.warning });
        if (items.length === 0) {
          items.push({ label: 'All Checks', value: 'Passed', color: T.safe });
        }
        setRiskFactors(items);
      })();
    }
  }, [visible, amount, destination]);

  const handleApprove = () => {
    setResolved('approved');
    if (onApprove) onApprove();
  };

  const handleReject = () => setResolved('rejected');

  const displayAmount = amount > 0 ? `$${amount.toLocaleString()} ${token}` : `${amount} ${token}`;

  if (resolved === 'rejected') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <FadeInView style={styles.modal}>
            <View style={[styles.resolvedIcon, { backgroundColor: T.danger + '20' }]}>
              <CloseIcon size={28} color={T.danger} />
            </View>
            <Text style={styles.verdictText}>Transaction Rejected</Text>
            <Text style={styles.verdictSubtext}>Covenant rules blocked this transaction. No funds moved.</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </FadeInView>
        </View>
      </Modal>
    );
  }

  if (resolved === 'approved') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <FadeInView style={styles.modal}>
            <View style={[styles.resolvedIcon, { backgroundColor: T.safe + '20' }]}>
              <CheckIcon size={28} color={T.safe} />
            </View>
            <Text style={styles.verdictText}>Transaction Approved</Text>
            <Text style={styles.verdictSubtext}>{displayAmount} sent. Proceed with caution.</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </FadeInView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <FadeInView style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.reviewHeader}>
            <View style={styles.reviewIcon}>
              <AlertIcon size={22} color={T.warning} />
            </View>
            <View>
              <Text style={styles.reviewTitle}>Transaction Review</Text>
              <Text style={styles.reviewSubtext}>Review before approving</Text>
            </View>
          </View>

          {/* Amount & Destination */}
          <View style={styles.contractCard}>
            <View>
              <Text style={styles.contractLabel}>Amount</Text>
              <Text style={styles.contractAddress}>{displayAmount}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.contractLabel}>To</Text>
              <Text style={styles.contractAddress} numberOfLines={1}>
                {destination.length > 12 ? `${destination.slice(0, 6)}...${destination.slice(-4)}` : destination}
              </Text>
            </View>
          </View>

          {/* Risk Level */}
          <View style={styles.riskSection}>
            <View style={[styles.riskBadge, {
              backgroundColor: riskFactors.some(r => r.color === T.danger) ? T.danger + '20' :
                riskFactors.some(r => r.color === T.warning) ? T.warning + '20' : T.safe + '20'
            }]}>
              <Text style={[styles.riskText, {
                color: riskFactors.some(r => r.color === T.danger) ? T.danger :
                  riskFactors.some(r => r.color === T.warning) ? T.warning : T.safe
              }]}>
                {riskFactors.some(r => r.color === T.danger) ? 'High Risk' :
                 riskFactors.some(r => r.color === T.warning) ? 'Moderate Risk' : 'Low Risk'}
              </Text>
            </View>
          </View>

          {/* Evidence */}
          {riskFactors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Risk Factors</Text>
              <EvidenceList items={riskFactors} />
            </>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.85}>
              <CloseIcon size={16} color={T.ink} />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.85}>
              <Text style={styles.approveText}>Proceed Anyway</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: T.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: T.s5, paddingBottom: T.s7 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.surfaceElevated, alignSelf: 'center', marginBottom: T.s5 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: T.s3, marginBottom: T.s5 },
  reviewIcon: { width: 44, height: 44, borderRadius: T.radiusFull, backgroundColor: T.warning + '20', alignItems: 'center', justifyContent: 'center' },
  reviewTitle: { fontFamily: T.fontBold, fontSize: 20, color: T.ink, letterSpacing: -0.3 },
  reviewSubtext: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  contractCard: { backgroundColor: T.bg, borderRadius: T.radius, padding: T.s4, marginBottom: T.s5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contractLabel: { fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  contractAddress: { fontFamily: T.fontMono || T.fontFamily, fontSize: 13, color: T.ink, fontVariant: ['tabular-nums'] },
  riskSection: { alignItems: 'center', marginBottom: T.s5 },
  riskBadge: { paddingHorizontal: T.s4, paddingVertical: T.s2, borderRadius: T.radiusFull },
  riskText: { fontFamily: T.fontSemiBold, fontSize: 14 },
  sectionTitle: { fontFamily: T.fontSemiBold, fontSize: 14, color: T.ink, marginBottom: T.s2 },
  evidenceList: { marginBottom: T.s5, gap: T.s2 },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, borderRadius: T.radiusSm, padding: T.s3, gap: T.s2 },
  evidenceDot: { width: 8, height: 8, borderRadius: 4 },
  evidenceLabel: { flex: 1, fontFamily: T.fontFamily, fontSize: 13, color: T.inkMuted },
  evidenceValue: { fontFamily: T.fontSemiBold, fontSize: 13 },
  actions: { flexDirection: 'row', gap: T.s3 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: T.s2, backgroundColor: T.danger, paddingVertical: T.s4, borderRadius: T.radius },
  rejectText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  approveBtn: { flex: 1, paddingVertical: T.s4, borderRadius: T.radius, alignItems: 'center', justifyContent: 'center', backgroundColor: T.accent },
  approveText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
  resolvedIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: T.s5 },
  verdictText: { fontFamily: T.fontBold, fontSize: 22, color: T.ink, textAlign: 'center', letterSpacing: -0.3 },
  verdictSubtext: { fontFamily: T.fontFamily, fontSize: 14, color: T.inkMuted, textAlign: 'center', marginTop: T.s1, marginBottom: T.s5 },
  dismissBtn: { paddingVertical: T.s3, paddingHorizontal: T.s6, borderRadius: T.radius, backgroundColor: T.surfaceElevated, alignItems: 'center', alignSelf: 'center' },
  dismissText: { fontFamily: T.fontSemiBold, fontSize: 15, color: T.ink },
});
