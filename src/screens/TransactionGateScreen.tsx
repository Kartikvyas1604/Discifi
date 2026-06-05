import { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { T } from '../theme';
import { Glyph } from '../components/Glyph';

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
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1,
        false,
      );
    }
    setResolved(null);
  }, [visible]);

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleReject = () => setResolved('rejected');
  const handleApprove = () => setResolved('approved');

  if (resolved === 'rejected') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Glyph symbol="⊘" size={36} color={T.danger} />
            <Text style={styles.verdictText}>TRANSACTION REJECTED</Text>
            <Text style={styles.verdictSubtext}>No funds moved.</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.dismissText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (resolved === 'approved') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Glyph symbol="◈" size={36} color={T.gold} />
            <Text style={styles.verdictText}>TRANSACTION PROCEEDED</Text>
            <Text style={styles.verdictSubtext}>$2,450 approved.</Text>
            <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.dismissText}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn.duration(240)} style={styles.modal}>
          <Text style={styles.reviewLabel}>TRANSACTION REVIEW</Text>

          <View style={{ alignItems: 'center', marginVertical: T.s5 }}>
            <Animated.View style={rotateStyle}>
              <Glyph symbol="◈" size={40} color={T.gold} />
            </Animated.View>
          </View>

          <Text style={styles.contractAddress}>0x4f3c...b82a</Text>

          <View style={styles.riskSection}>
            <Text style={styles.riskNumeral}>III</Text>
            <Text style={styles.riskLabel}>MODERATE RISK</Text>
          </View>

          <EvidenceList
            items={[
              { label: 'CONTRACT AGE', value: '14 days', color: T.danger },
              { label: 'APPROVAL AMOUNT', value: '$1,240', color: T.gold },
              { label: 'TOKEN CATEGORY', value: 'Memecoin', color: T.danger },
              { label: 'BEHAVIOR MATCH', value: 'New pattern', color: T.inkMuted },
            ]}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.85}>
              <Text style={styles.rejectText}>REJECT</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.85}>
              <Text style={styles.approveText}>⚠ PROCEED ANYWAY</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(245, 240, 232, 0.92)',
    justifyContent: 'center',
    paddingHorizontal: T.s5,
  },
  modal: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    padding: T.s6,
  },
  reviewLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
    textAlign: 'center',
  },
  contractAddress: {
    fontFamily: T.fontMono,
    fontSize: 13,
    color: T.inkMuted,
    textAlign: 'center',
    marginBottom: T.s4,
  },
  riskSection: {
    alignItems: 'center',
    marginBottom: T.s5,
  },
  riskNumeral: {
    fontFamily: T.fontDisplay,
    fontSize: 64,
    color: T.ink,
    lineHeight: 68,
  },
  riskLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 2,
    color: T.inkMuted,
  },
  evidenceList: {
    marginBottom: T.s6,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: T.s2,
    borderBottomWidth: T.hairline,
    borderBottomColor: T.border,
  },
  evidenceLabel: {
    fontFamily: T.fontBody,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.inkMuted,
  },
  evidenceValue: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.ink,
  },
  actions: {
    gap: 0,
  },
  rejectBtn: {
    backgroundColor: T.danger,
    paddingVertical: T.s4,
    alignItems: 'center',
  },
  rejectText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.bg,
    letterSpacing: 2,
  },
  actionDivider: {
    height: T.hairline,
    backgroundColor: T.border,
  },
  approveBtn: {
    paddingVertical: T.s4,
    alignItems: 'center',
  },
  approveText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.ink,
    letterSpacing: 1,
  },
  verdictText: {
    fontFamily: T.fontDisplay,
    fontSize: 20,
    color: T.ink,
    textAlign: 'center',
    marginTop: T.s3,
  },
  verdictSubtext: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.inkMuted,
    textAlign: 'center',
    marginTop: T.s1,
  },
  dismissBtn: {
    marginTop: T.s6,
    paddingVertical: T.s3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  dismissText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.ink,
    letterSpacing: 2,
  },
});
