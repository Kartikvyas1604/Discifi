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
}

export default function TransactionGateScreen({ visible, onClose }: TransactionGateScreenProps) {
  const [resolved, setResolved] = useState<'rejected' | 'approved' | null>(null);

  useEffect(() => {
    setResolved(null);
  }, [visible]);

  const handleReject = () => setResolved('rejected');
  const handleApprove = () => setResolved('approved');

  if (resolved === 'rejected') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <FadeInView style={styles.modal}>
            <View style={styles.resolvedIcon}>
              <CloseIcon size={28} color={T.danger} />
            </View>
            <Text style={styles.verdictText}>Transaction Rejected</Text>
            <Text style={styles.verdictSubtext}>No funds moved. Contract was blocked.</Text>
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
            <Text style={styles.verdictSubtext}>$2,450 sent. Proceed with caution.</Text>
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
          {/* Header */}
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

          {/* Contract */}
          <View style={styles.contractCard}>
            <Text style={styles.contractLabel}>Contract</Text>
            <Text style={styles.contractAddress}>0x4f3c...b82a</Text>
          </View>

          {/* Risk Level */}
          <View style={styles.riskSection}>
            <View style={[styles.riskBadge, { backgroundColor: T.warning + '20' }]}>
              <Text style={[styles.riskText, { color: T.warning }]}>Moderate Risk</Text>
            </View>
          </View>

          {/* Evidence */}
          <Text style={styles.sectionTitle}>Risk Factors</Text>
          <EvidenceList
            items={[
              { label: 'Contract Age', value: '14 days', color: T.danger },
              { label: 'Approval Amount', value: '$1,240', color: T.warning },
              { label: 'Token Category', value: 'Memecoin', color: T.danger },
              { label: 'Behavior Match', value: 'New pattern', color: T.inkMuted },
            ]}
          />

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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: T.s5,
    paddingBottom: T.s7,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.surfaceElevated,
    alignSelf: 'center',
    marginBottom: T.s4,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
    marginBottom: T.s5,
  },
  reviewIcon: {
    width: 44,
    height: 44,
    borderRadius: T.radiusFull,
    backgroundColor: T.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTitle: {
    fontFamily: T.fontBold,
    fontSize: 20,
    color: T.ink,
    letterSpacing: -0.3,
  },
  reviewSubtext: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  contractCard: {
    backgroundColor: T.bg,
    borderRadius: T.radius,
    padding: T.s4,
    marginBottom: T.s4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractLabel: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  contractAddress: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.ink,
    fontVariant: ['tabular-nums'],
  },
  riskSection: {
    alignItems: 'center',
    marginBottom: T.s5,
  },
  riskBadge: {
    paddingHorizontal: T.s4,
    paddingVertical: T.s2,
    borderRadius: T.radiusFull,
  },
  riskText: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: T.fontSemiBold,
    fontSize: 14,
    color: T.ink,
    marginBottom: T.s2,
  },
  evidenceList: {
    marginBottom: T.s5,
    gap: T.s2,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: T.radiusSm,
    padding: T.s3,
    gap: T.s2,
  },
  evidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  evidenceLabel: {
    flex: 1,
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkMuted,
  },
  evidenceValue: {
    fontFamily: T.fontSemiBold,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: T.s3,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: T.s2,
    backgroundColor: T.danger,
    paddingVertical: T.s4,
    borderRadius: T.radius,
  },
  rejectText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  approveBtn: {
    flex: 1,
    paddingVertical: T.s4,
    borderRadius: T.radius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.accent,
  },
  approveText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
  resolvedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.danger + '20',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: T.s4,
  },
  verdictText: {
    fontFamily: T.fontBold,
    fontSize: 22,
    color: T.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  verdictSubtext: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.inkMuted,
    textAlign: 'center',
    marginTop: T.s1,
    marginBottom: T.s6,
  },
  dismissBtn: {
    paddingVertical: T.s3,
    paddingHorizontal: T.s6,
    borderRadius: T.radius,
    backgroundColor: T.surfaceElevated,
    alignItems: 'center',
    alignSelf: 'center',
  },
  dismissText: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
  },
});
