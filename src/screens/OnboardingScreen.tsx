import { useState, useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { T } from '../theme';
import { ShieldIcon, SparklesIcon, CheckIcon } from '../components/Icons';

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
      <Animated.View entering={FadeInUp.duration(400)} style={stepStyles.logoContainer}>
        <View style={stepStyles.logo}>
          <SparklesIcon size={32} color={T.accentLight} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(150).duration(400)}>
        <Text style={stepStyles.title}>DisciFi</Text>
        <Text style={stepStyles.tagline}>Financial discipline, onchain.</Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(300).duration(400)}>
        <TouchableOpacity onPress={onNext} style={stepStyles.primaryBtn} activeOpacity={0.8}>
          <Text style={stepStyles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={stepStyles.hint}>Set up your spending rules in 3 steps</Text>
      </Animated.View>
    </View>
  );
}

function StepChoose({ selected, onSelect, onNext }: { selected: CovenantId | null; onSelect: (id: CovenantId) => void; onNext: () => void }) {
  return (
    <View style={stepStyles.stepContainer}>
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={stepStyles.stepLabel}>Choose your covenant</Text>
        <Text style={stepStyles.stepDesc}>Pick a discipline style that fits your needs</Text>
      </Animated.View>
      <View style={stepStyles.grid}>
        {COVENANTS.map((c, i) => (
          <Animated.View
            key={c.id}
            entering={FadeInUp.delay(80 * i).duration(300)}
          >
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
          </Animated.View>
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
      <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center' }}>
        <Text style={stepStyles.stepLabel}>Set daily limit</Text>
        <Text style={stepStyles.stepDesc}>Maximum you can spend per day</Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(150).duration(400)} style={stepStyles.limitContainer}>
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
      </Animated.View>
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
      <Animated.View entering={FadeInUp.duration(400)} style={{ alignItems: 'center' }}>
        <View style={stepStyles.successIcon}>
          <CheckIcon size={32} color={T.safe} />
        </View>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(200).duration(400)} style={{ alignItems: 'center' }}>
        <Text style={stepStyles.confirmTitle}>Ready to go</Text>
        <Text style={stepStyles.confirmDesc}>Your covenants are set up and active</Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(350).duration(400)} style={stepStyles.summaryCard}>
        <View style={stepStyles.summaryRow}>
          <ShieldIcon size={16} color={T.accentLight} />
          <Text style={stepStyles.summaryText}>Guardian · $800/day limit</Text>
        </View>
        <View style={stepStyles.summaryRow}>
          <PercentIcon16 />
          <Text style={stepStyles.summaryText}>Auto-save: 15%</Text>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(500).duration(400)}>
        <TouchableOpacity onPress={onComplete} style={stepStyles.primaryBtn} activeOpacity={0.8}>
          <Text style={stepStyles.primaryBtnText}>Enter the Ledger</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function PercentIcon16() {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 12, color: T.safe, fontFamily: T.fontBold }}>%</Text>
    </View>
  );
}

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<CovenantId | null>(null);

  const handleNext = useCallback(() => {
    if (step < 3) setStep(s => s + 1);
    else onComplete();
  }, [step, onComplete]);

  return (
    <View style={styles.container}>
      <StepIndicator current={step + 1} total={4} />

      {step === 0 && <StepWelcome onNext={handleNext} />}
      {step === 1 && (
        <StepChoose
          selected={selected}
          onSelect={setSelected}
          onNext={handleNext}
        />
      )}
      {step === 2 && <StepSetLimit onNext={handleNext} />}
      {step === 3 && <StepConfirm onComplete={onComplete} />}
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
    paddingTop: T.s7 + 20,
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
    backgroundColor: T.accent,
    paddingVertical: T.s4,
    paddingHorizontal: T.s8,
    borderRadius: T.radius,
    alignItems: 'center',
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
    marginBottom: T.s6,
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
    marginBottom: T.s6,
  },
  summaryCard: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.s4,
    gap: T.s3,
    marginBottom: T.s6,
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
