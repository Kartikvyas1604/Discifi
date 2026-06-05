import { useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { theme, spacing } from '../theme';
import { PulseRing } from '../components/PulseRing';

function FlickerText({ text, style }: { text: string; style?: any }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 400, easing: Easing.ease }),
        withTiming(1, { duration: 400, easing: Easing.ease }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[style, animatedStyle]}>
      {text}
    </Animated.Text>
  );
}

interface RiskRowProps {
  label: string;
  value: number;
  color: string;
}

function RiskRow({ label, value, color }: RiskRowProps) {
  return (
    <View style={styles.riskRow}>
      <Text style={styles.riskLabel}>{label}</Text>
      <View style={styles.riskBarTrack}>
        <View style={[styles.riskBarFill, { width: `${value * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function TransactionGateScreen() {
  const modalScale = useSharedValue(0.96);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    modalScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    modalOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.pulseContainer}>
        <PulseRing size={300} color={theme.warning} count={3} />
      </View>

      <Animated.View style={[styles.modal, modalStyle]} entering={FadeIn.duration(300)}>
        <View style={styles.warningHeader}>
          <Text style={styles.warningIcon}>⚠</Text>
          <FlickerText text="TRANSACTION REVIEW" style={styles.warningTitle} />
        </View>

        <View style={styles.addressSection}>
          <Text style={styles.addressLabel}>CONTRACT</Text>
          <Text style={styles.addressValue}>0x7a3b...9f2c</Text>
          <Text style={styles.addressHint}>unverified source</Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>REQUESTED AMOUNT</Text>
          <Text style={styles.amountValue}>$2,450.00</Text>
          <Text style={styles.amountToken}>12,500 USDC</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.riskSectionTitle}>RISK BREAKDOWN</Text>
        <RiskRow label="Contract Age" value={0.15} color={theme.red} />
        <RiskRow label="Approval Amount" value={0.75} color={theme.amber} />
        <RiskRow label="Token Category" value={0.9} color={theme.green} />
        <RiskRow label="Behavior Pattern" value={0.3} color={theme.amber} />

        <Text style={styles.riskScore}>Risk Score: 72 / 100</Text>
      </Animated.View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rejectBtn} activeOpacity={0.85}>
          <Text style={styles.rejectBtnText}>REJECT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.approveBtn} activeOpacity={0.85}>
          <Text style={styles.approveBtnText}>APPROVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pulseContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    opacity: 0.3,
  },
  modal: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.warning,
    padding: spacing.xl,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  warningIcon: {
    fontSize: 18,
    color: theme.warning,
  },
  warningTitle: {
    fontFamily: theme.fontMonoBold,
    fontSize: 13,
    color: theme.warning,
    letterSpacing: 2,
  },
  addressSection: {
    marginBottom: spacing.xl,
  },
  addressLabel: {
    fontFamily: theme.fontBody,
    fontSize: 9,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  addressValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 22,
    color: theme.text,
    marginBottom: 2,
  },
  addressHint: {
    fontFamily: theme.fontMono,
    fontSize: 10,
    color: theme.warning,
  },
  amountSection: {
    marginBottom: spacing.xl,
  },
  amountLabel: {
    fontFamily: theme.fontBody,
    fontSize: 9,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  amountValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 28,
    color: theme.text,
    marginBottom: 2,
  },
  amountToken: {
    fontFamily: theme.fontMono,
    fontSize: 12,
    color: theme.textDim,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: spacing.lg,
  },
  riskSectionTitle: {
    fontFamily: theme.fontBody,
    fontSize: 9,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  riskLabel: {
    fontFamily: theme.fontMono,
    fontSize: 10,
    color: theme.textDim,
    width: 120,
  },
  riskBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.border,
  },
  riskBarFill: {
    height: '100%',
  },
  riskScore: {
    fontFamily: theme.fontMonoBold,
    fontSize: 12,
    color: theme.amber,
    textAlign: 'right',
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  rejectBtn: {
    flex: 1.1,
    backgroundColor: theme.warning,
    paddingVertical: 18,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontFamily: theme.fontMonoBold,
    fontSize: 13,
    color: theme.bg,
    letterSpacing: 2,
  },
  approveBtn: {
    flex: 0.9,
    borderWidth: 1,
    borderColor: theme.accent,
    paddingVertical: 18,
    alignItems: 'center',
  },
  approveBtnText: {
    fontFamily: theme.fontMonoBold,
    fontSize: 13,
    color: theme.accent,
    letterSpacing: 2,
  },
});
