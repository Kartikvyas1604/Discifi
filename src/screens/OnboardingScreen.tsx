import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Animated,
  type ViewStyle,
} from 'react-native';
import { T } from '../theme';
import { ShieldIcon, CheckIcon, DisciFiLogo } from '../components/Icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import GenerateWalletScreen from './GenerateWalletScreen';
import RestoreWalletScreen from './RestoreWalletScreen';
import type { WalletSet } from '../crypto/types';

function FadeInView({
  delay = 0,
  duration = 400,
  translateY = 20,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      ...(translateY !== 0 ? [Animated.timing(y, { toValue: 0, duration, delay, useNativeDriver: true })] : []),
    ]).start();
  }, []);

  return <Animated.View style={[style, { opacity, transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

const { width: SCREEN_W } = Dimensions.get('window');

type CovenantId = 'guardian' | 'trader' | 'hodler' | 'architect';

interface CovenantOption {
  id: CovenantId;
  name: string;
  desc: string;
  emoji: string;
}

const COVENANTS: CovenantOption[] = [
  { id: 'guardian', name: 'Guardian', desc: 'Maximum protection for beginners', emoji: '🛡️' },
  { id: 'trader', name: 'Trader', desc: 'DeFi-optimized with flexible limits', emoji: '📊' },
  { id: 'hodler', name: 'Hodler', desc: 'Long-term lock with cooldown rules', emoji: '🏦' },
  { id: 'architect', name: 'Architect', desc: 'Fully custom build-your-own', emoji: '⚙️' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.indicatorRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            stepStyles.dot,
            i < current && stepStyles.dotFilled,
            i === current - 1 && stepStyles.dotCurrent,
          ]}
        />
      ))}
    </View>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={stepStyles.center}>
      <FadeInView duration={400} style={stepStyles.logoContainer}>
        <DisciFiLogo size={48} />
      </FadeInView>
      <FadeInView delay={150} duration={400}>
        <Text style={stepStyles.title}>DisciFi</Text>
        <Text style={stepStyles.tagline}>Financial discipline, onchain.</Text>
      </FadeInView>
      <FadeInView delay={300} duration={400}>
        <TouchableOpacity onPress={onNext} style={stepStyles.primaryBtn} activeOpacity={0.8}>
          <Text style={stepStyles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={stepStyles.hint}>Set up your spending rules in 3 steps</Text>
      </FadeInView>
    </View>
  );
}

function StepChoose({ selected, onSelect, onNext }: { selected: CovenantId | null; onSelect: (id: CovenantId) => void; onNext: () => void }) {
  return (
    <View style={stepStyles.stepContainer}>
      <FadeInView duration={300} translateY={0}>
        <Text style={stepStyles.stepLabel}>Choose your covenant</Text>
        <Text style={stepStyles.stepDesc}>Pick a discipline style that fits your needs</Text>
      </FadeInView>
      <View style={stepStyles.grid}>
        {COVENANTS.map((c, i) => (
          <FadeInView key={c.id} delay={80 * i} duration={300}>
            <TouchableOpacity
              style={[
                stepStyles.covenantCard,
                selected === c.id && stepStyles.covenantCardActive,
              ]}
              onPress={() => onSelect(c.id)}
              activeOpacity={0.8}
            >
              <Text style={stepStyles.covenantEmoji}>{c.emoji}</Text>
              <Text style={stepStyles.covenantName}>{c.name}</Text>
              <Text style={stepStyles.covenantDesc}>{c.desc}</Text>
              {selected === c.id && (
                <View style={stepStyles.checkmark}>
                  <CheckIcon size={16} color={T.accent} />
                </View>
              )}
            </TouchableOpacity>
          </FadeInView>
        ))}
      </View>
      <TouchableOpacity
        style={[stepStyles.primaryBtn, !selected && stepStyles.primaryBtnDisabled]}
        onPress={onNext}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={[stepStyles.primaryBtnText, !selected && { color: T.inkFaint }]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepSetLimit({ onNext }: { onNext: () => void }) {
  const [value, setValue] = useState('800');

  return (
    <View style={stepStyles.stepContainer}>
      <FadeInView duration={300} translateY={0} style={{ alignItems: 'center' }}>
        <Text style={stepStyles.stepLabel}>Set daily limit</Text>
        <Text style={stepStyles.stepDesc}>Maximum you can spend per day</Text>
      </FadeInView>
      <FadeInView delay={150} duration={400} style={stepStyles.limitContainer}>
        <View style={styles.limitInputRow}>
          <Text style={stepStyles.dollarSign}>$</Text>
          <TextInput
            style={stepStyles.limitInput}
            value={value}
            onChangeText={setValue}
            keyboardType="number-pad"
            returnKeyType="done"
            autoFocus
            selectionColor={T.accent}
            placeholderTextColor={T.inkFaint}
          />
        </View>
        <Text style={stepStyles.limitLabel}>daily spending limit</Text>
      </FadeInView>
      <TouchableOpacity
        style={stepStyles.primaryBtn}
        onPress={onNext}
        activeOpacity={0.8}
      >
        <Text style={stepStyles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepConfirm({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={stepStyles.stepContainer}>
      <FadeInView duration={400} style={{ alignItems: 'center' }}>
        <DisciFiLogo size={40} />
      </FadeInView>
      <FadeInView delay={200} duration={400} style={{ alignItems: 'center' }}>
        <Text style={stepStyles.confirmTitle}>Ready to go</Text>
        <Text style={stepStyles.confirmDesc}>Your covenants are set up and active</Text>
      </FadeInView>
      <FadeInView delay={350} duration={400} style={stepStyles.summaryCard}>
        <View style={stepStyles.summaryRow}>
          <ShieldIcon size={16} color={T.accentLight} />
          <Text style={stepStyles.summaryText}>Guardian · $800/day limit</Text>
        </View>
        <View style={stepStyles.summaryRow}>
          <PercentIcon16 />
          <Text style={stepStyles.summaryText}>Auto-save: 15%</Text>
        </View>
      </FadeInView>
      <FadeInView delay={500} duration={400}>
        <TouchableOpacity onPress={onComplete} style={stepStyles.primaryBtn} activeOpacity={0.8}>
          <Text style={stepStyles.primaryBtnText}>Enter the Ledger</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );
}

function PercentIcon16() {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="trending-up-outline" size={12} color={T.safe} />
    </View>
  );
}

export default function OnboardingScreen({ onComplete }: { onComplete: (wallets: WalletSet) => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<CovenantId | null>(null);
  const [wallets, setWallets] = useState<WalletSet | null>(null);

  const handleNext = useCallback(() => {
    if (step < 5) setStep(s => s + 1);
  }, [step]);

  const handleWalletCreated = useCallback((derived: WalletSet) => {
    setWallets(derived);
    setStep(3);
  }, []);

  const handleFinalComplete = useCallback(() => {
    if (wallets) {
      onComplete(wallets);
    }
  }, [wallets, onComplete]);

  return (
    <View style={styles.container}>
      {(step === 0 || (step >= 3 && step <= 5)) && (
        <StepIndicator current={step >= 3 ? step - 2 : step + 1} total={4} />
      )}

      {step === 0 && <StepWelcome onNext={handleNext} />}
      {step === 1 && <StepWalletMethod onNext={() => setStep(2)} onRestore={() => setStep(6)} />}
      {step === 2 && <GenerateWalletScreen onComplete={handleWalletCreated} />}
      {step === 3 && (
        <StepChoose
          selected={selected}
          onSelect={setSelected}
          onNext={handleNext}
        />
      )}
      {step === 4 && <StepSetLimit onNext={handleNext} />}
      {step === 5 && <StepConfirm onComplete={handleFinalComplete} />}
      {step === 6 && <RestoreWalletScreen onComplete={handleWalletCreated} />}
    </View>
  );
}

function StepWalletMethod({ onNext, onRestore }: { onNext: () => void; onRestore: () => void }) {
  return (
    <View style={[stepStyles.center, { paddingTop: T.s8 }]}>
      <FadeInView duration={400}>
        <DisciFiLogo size={48} />
      </FadeInView>
      <FadeInView delay={150} duration={400}>
        <Text style={stepStyles.title}>Welcome to DisciFi</Text>
        <Text style={stepStyles.tagline}>Your onchain financial discipline engine</Text>
      </FadeInView>
      <FadeInView delay={300} duration={400} style={{ width: '100%', paddingHorizontal: T.s4, gap: T.s3 }}>
        <TouchableOpacity onPress={onNext} style={stepStyles.primaryBtn} activeOpacity={0.8}>
          <Ionicons name="sparkles-outline" size={20} color={T.ink} style={{ marginRight: T.s2 }} />
          <Text style={stepStyles.primaryBtnText}>Create New Wallet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRestore} style={stepStyles.secondaryBtn} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={20} color={T.accent} style={{ marginRight: T.s2 }} />
          <Text style={stepStyles.secondaryBtnText}>Restore Existing Wallet</Text>
        </TouchableOpacity>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  limitInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
});

const stepStyles = StyleSheet.create({
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: T.s2,
    paddingTop: T.s7 + T.s4,
    paddingBottom: T.s5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.surfaceElevated,
  },
  dotFilled: {
    backgroundColor: T.accent,
    opacity: 0.5,
  },
  dotCurrent: {
    width: 24,
    backgroundColor: T.accent,
    opacity: 1,
    borderRadius: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: T.s4,
    paddingBottom: T.s8,
    gap: T.s6,
  },
  logoContainer: {
    marginBottom: T.s2,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: T.fontBold,
    fontSize: 36,
    color: T.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: T.fontFamily,
    fontSize: 16,
    color: T.inkMuted,
    textAlign: 'center',
    marginTop: T.s1,
  },
  hint: {
    fontFamily: T.fontFamily,
    fontSize: 13,
    color: T.inkFaint,
    textAlign: 'center',
    marginTop: T.s3,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: T.accent,
    paddingVertical: T.s4,
    paddingHorizontal: T.s8,
    borderRadius: T.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnDisabled: {
    backgroundColor: T.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: T.s4,
    paddingHorizontal: T.s8,
    borderRadius: T.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    borderWidth: 1,
    borderColor: T.accent,
  },
  secondaryBtnText: {
    fontFamily: T.fontSemiBold,
    fontSize: 16,
    color: T.accent,
    letterSpacing: 0.3,
  },
  primaryBtnText: {
    fontFamily: T.fontSemiBold,
    fontSize: 16,
    color: T.ink,
    letterSpacing: 0.3,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: T.s4,
    paddingTop: T.s5,
  },
  stepLabel: {
    fontFamily: T.fontBold,
    fontSize: 26,
    color: T.ink,
    letterSpacing: -0.5,
    marginBottom: T.s1,
  },
  stepDesc: {
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.inkMuted,
    marginBottom: T.s5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.s3,
    marginBottom: T.s5,
  },
  covenantCard: {
    width: (SCREEN_W - T.s4 * 2 - T.s3) / 2,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    minHeight: 120,
    borderWidth: 1,
    borderColor: T.border,
    position: 'relative',
  },
  covenantCardActive: {
    borderColor: T.accent,
    backgroundColor: T.accent + '10',
  },
  covenantEmoji: {
    fontSize: 28,
    marginBottom: T.s2,
  },
  covenantName: {
    fontFamily: T.fontSemiBold,
    fontSize: 15,
    color: T.ink,
    marginBottom: T.s1,
  },
  covenantDesc: {
    fontFamily: T.fontFamily,
    fontSize: 12,
    color: T.inkMuted,
    lineHeight: 16,
  },
  checkmark: {
    position: 'absolute',
    top: T.s2,
    right: T.s2,
  },
  limitContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  dollarSign: {
    fontFamily: T.fontBold,
    fontSize: 48,
    color: T.inkFaint,
  },
  limitInput: {
    fontFamily: T.fontBold,
    fontSize: 56,
    color: T.ink,
    padding: 0,
    minWidth: 140,
    textAlign: 'center',
    letterSpacing: -1,
  },
  limitLabel: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.inkMuted,
    marginTop: T.s2,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.safe + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: T.s4,
  },
  confirmTitle: {
    fontFamily: T.fontBold,
    fontSize: 28,
    color: T.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  confirmDesc: {
    fontFamily: T.fontFamily,
    fontSize: 15,
    color: T.inkMuted,
    textAlign: 'center',
    marginTop: T.s1,
    marginBottom: T.s5,
  },
  summaryCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    gap: T.s3,
    marginBottom: T.s5,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: T.s3,
  },
  summaryText: {
    fontFamily: T.fontFamily,
    fontSize: 14,
    color: T.ink,
  },
});
