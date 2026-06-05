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
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import Svg, { Polygon, Circle } from 'react-native-svg';
import { T } from '../theme';
import { StepIndicator } from '../components/StepIndicator';
import { Glyph } from '../components/Glyph';

const { width: SCREEN_W } = Dimensions.get('window');

type CovenantId = 'guardian' | 'trader' | 'hodler' | 'architect';

interface CovenantOption {
  id: CovenantId;
  name: string;
  desc: string;
}

const COVENANTS: CovenantOption[] = [
  { id: 'guardian', name: 'THE GUARDIAN', desc: 'Beginner safety — maximum protection' },
  { id: 'trader', name: 'THE TRADER', desc: 'DeFi-optimized with flexible limits' },
  { id: 'hodler', name: 'THE HODLER', desc: 'Long-term lock with cooldown rules' },
  { id: 'architect', name: 'THE ARCHITECT', desc: 'Custom covenant — build your own' },
];

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={stepStyles.center}>
      <Glyph symbol="◈" size={48} color={T.gold} />
      <Text style={stepStyles.wordmark}>DISCIFI</Text>
      <Text style={stepStyles.tagline}>Financial discipline, onchain.</Text>
      <TouchableOpacity onPress={onNext} style={stepStyles.beginBtn} activeOpacity={0.7}>
        <Text style={stepStyles.beginText}>BEGIN →</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepChoose({ selected, onSelect, onNext }: { selected: CovenantId | null; onSelect: (id: CovenantId) => void; onNext: () => void }) {
  return (
    <View style={{ paddingHorizontal: T.s4, flex: 1 }}>
      <Text style={stepStyles.chooseLabel}>SELECT YOUR DISCIPLINE</Text>
      <View style={stepStyles.grid}>
        {COVENANTS.map((c, i) => (
          <Animated.View
            key={c.id}
            entering={FadeInUp.delay(80 * i).duration(300)}
            style={{ width: (SCREEN_W - T.s4 * 2 - T.s3) / 2 }}
          >
            <TouchableOpacity
              style={[
                stepStyles.covenantCard,
                selected === c.id && stepStyles.covenantCardActive,
              ]}
              onPress={() => onSelect(c.id)}
              activeOpacity={0.8}
            >
              {selected === c.id && (
                <Text style={stepStyles.selectedDot}>●</Text>
              )}
              <Text style={stepStyles.covenantName}>{c.name}</Text>
              <Text style={stepStyles.covenantDesc}>{c.desc}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
      <TouchableOpacity
        style={[stepStyles.nextBtn, !selected && stepStyles.nextBtnDisabled]}
        onPress={onNext}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <Text style={[stepStyles.nextBtnText, !selected && stepStyles.nextBtnTextDisabled]}>CONTINUE →</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepSetLimit({ onNext }: { onNext: () => void }) {
  const [value, setValue] = useState('800');

  return (
    <View style={{ paddingHorizontal: T.s4, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={stepStyles.dollarSign}>$</Text>
        <TextInput
          style={stepStyles.limitInput}
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          returnKeyType="done"
          autoFocus
          selectionColor={T.gold}
        />
      </View>
      <Text style={stepStyles.limitLabel}>daily spending limit</Text>
      <TouchableOpacity
        style={[stepStyles.nextBtn, { marginTop: T.s8 }]}
        onPress={onNext}
        activeOpacity={0.8}
      >
        <Text style={stepStyles.nextBtnText}>CONTINUE →</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepConfirm({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={{ paddingHorizontal: T.s4, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={stepStyles.confirmTitle}>COVENANT ESTABLISHED</Text>
      <Glyph symbol="◈" size={40} color={T.gold} />
      <View style={stepStyles.summary}>
        <Text style={stepStyles.summaryLine}>Guardian · $800/day limit</Text>
        <Text style={stepStyles.summaryLine}>Auto-save: 15%</Text>
        <Text style={stepStyles.summaryLine}>Allowlist: enabled</Text>
      </View>
      <TouchableOpacity onPress={onComplete} style={stepStyles.enterBtn} activeOpacity={0.7}>
        <Text style={stepStyles.enterText}>ENTER THE LEDGER →</Text>
      </TouchableOpacity>
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
});

const stepStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: T.s8,
  },
  wordmark: {
    fontFamily: T.fontDisplay,
    fontSize: 32,
    color: T.ink,
    letterSpacing: 8,
    marginTop: T.s4,
    marginBottom: T.s2,
  },
  tagline: {
    fontFamily: T.fontDisplayItalic,
    fontSize: 22,
    color: T.inkMuted,
    fontStyle: 'italic',
  },
  beginBtn: {
    marginTop: T.s8,
    paddingVertical: T.s3,
    paddingHorizontal: T.s6,
  },
  beginText: {
    fontFamily: T.fontMono,
    fontSize: 11,
    color: T.gold,
    letterSpacing: 2,
  },
  chooseLabel: {
    fontFamily: T.fontBody,
    fontSize: 10,
    letterSpacing: 2,
    color: T.inkMuted,
    marginBottom: T.s4,
    marginTop: T.s6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: T.s3,
  },
  covenantCard: {
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
    padding: T.s4,
    minHeight: 120,
    position: 'relative',
  },
  covenantCardActive: {
    borderColor: T.gold,
  },
  selectedDot: {
    position: 'absolute',
    top: T.s2,
    right: T.s2,
    fontSize: 12,
    color: T.gold,
  },
  covenantName: {
    fontFamily: T.fontDisplay,
    fontSize: 16,
    color: T.ink,
    marginBottom: T.s1,
  },
  covenantDesc: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.inkMuted,
    lineHeight: 16,
  },
  nextBtn: {
    borderWidth: 1,
    borderColor: T.ink,
    paddingVertical: T.s3,
    paddingHorizontal: T.s6,
    alignSelf: 'center',
    marginTop: T.s6,
  },
  nextBtnDisabled: {
    borderColor: T.inkFaint,
  },
  nextBtnText: {
    fontFamily: T.fontBody,
    fontSize: 11,
    color: T.ink,
    letterSpacing: 2,
  },
  nextBtnTextDisabled: {
    color: T.inkFaint,
  },
  dollarSign: {
    fontFamily: T.fontFigures,
    fontSize: 48,
    color: T.inkFaint,
  },
  limitInput: {
    fontFamily: T.fontFigures,
    fontSize: 48,
    color: T.ink,
    padding: 0,
    minWidth: 120,
    textAlign: 'center',
  },
  limitLabel: {
    fontFamily: T.fontBody,
    fontSize: 10,
    letterSpacing: 2,
    color: T.inkMuted,
    marginTop: T.s2,
  },
  confirmTitle: {
    fontFamily: T.fontDisplay,
    fontSize: 28,
    color: T.ink,
    textAlign: 'center',
    marginBottom: T.s5,
  },
  summary: {
    marginTop: T.s5,
    marginBottom: T.s8,
    alignItems: 'center',
    gap: T.s2,
  },
  summaryLine: {
    fontFamily: T.fontBody,
    fontSize: 13,
    color: T.inkMuted,
  },
  enterBtn: {
    borderWidth: 1,
    borderColor: T.ink,
    paddingVertical: T.s4,
    paddingHorizontal: T.s8,
  },
  enterText: {
    fontFamily: T.fontBody,
    fontSize: 12,
    color: T.ink,
    letterSpacing: 2,
  },
});
