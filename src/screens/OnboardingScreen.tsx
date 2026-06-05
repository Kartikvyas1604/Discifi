import { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import Svg, { Rect, Polygon, Circle, Path, G } from 'react-native-svg';
import { theme, spacing } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TemplateId = 'beginner' | 'trader' | 'hodler' | 'custom';

interface Template {
  id: TemplateId;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

function ShieldIcon() {
  return (
    <Svg width={40} height={48} viewBox="0 0 40 48">
      <Polygon points="20,2 38,12 38,28 20,46 2,28 2,12" fill="none" stroke={theme.accent} strokeWidth={1.5} />
      <Polygon points="20,8 32,15 32,25 20,38 8,25 8,15" fill="none" stroke={theme.textDim} strokeWidth={0.8} opacity={0.4} />
    </Svg>
  );
}

function LightningIcon() {
  return (
    <Svg width={32} height={48} viewBox="0 0 32 48">
      <Polygon points="18,2 6,26 14,26 10,46 28,20 18,20 24,2" fill="none" stroke={theme.accent} strokeWidth={1.5} />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={32} height={48} viewBox="0 0 32 48">
      <Rect x="6" y="20" width="20" height="22" fill="none" stroke={theme.accent} strokeWidth={1.5} />
      <Path d="M10,20 L10,14 Q10,6 16,6 Q22,6 22,14 L22,20" fill="none" stroke={theme.accent} strokeWidth={1.5} />
      <Circle cx="16" cy="30" r="4" fill="none" stroke={theme.textDim} strokeWidth={1} />
    </Svg>
  );
}

function CustomIcon() {
  return (
    <Svg width={40} height={48} viewBox="0 0 40 48">
      <Circle cx="20" cy="16" r="8" fill="none" stroke={theme.accent} strokeWidth={1.5} />
      <Path d="M8,40 Q20,28 32,40" fill="none" stroke={theme.accent} strokeWidth={1.5} />
    </Svg>
  );
}

const TEMPLATES: Template[] = [
  { id: 'beginner', label: 'BEGINNER SHIELD', desc: 'Conservative setup with max safety', icon: <ShieldIcon /> },
  { id: 'trader', label: 'TRADER MODE', desc: 'Flexible rules for active trading', icon: <LightningIcon /> },
  { id: 'hodler', label: 'HODLER LOCK', desc: 'Long-term hold protection', icon: <LockIcon /> },
  { id: 'custom', label: 'CUSTOM', desc: 'Build your own rule set', icon: <CustomIcon /> },
];

const STEPS = ['TEMPLATE', 'LIMITS', 'VAULT', 'CONFIRM'];

function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 60);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return (
    <Text style={styles.typewriterText}>
      {displayed}
      <Text style={styles.cursor}>▌</Text>
    </Text>
  );
}

function DiamondIcon() {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 600, easing: Easing.out(Easing.back) }),
      withTiming(1, { duration: 200 }),
    );
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Polygon points="32,4 60,32 32,60 4,32" fill="none" stroke={theme.accent} strokeWidth={2} />
        <Polygon points="32,16 48,32 32,48 16,32" fill={theme.accent} opacity={0.2} />
      </Svg>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const confirmScale = useSharedValue(0.3);

  useEffect(() => {
    if (step === 3) {
      confirmScale.value = withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.back) }),
        withTiming(1, { duration: 200 }),
      );
    }
  }, [step, confirmScale]);

  const confirmStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep(s => s + 1);
    } else if (step === 3) {
      setConfirmed(true);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const stepStr = `0${step + 1} / 0${STEPS.length}`;

  if (confirmed) {
    return (
      <View style={styles.container}>
        <View style={styles.confirmContainer}>
          <DiamondIcon />
          <TypewriterText text="WALLET ARMED" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>SAFETY SETUP</Text>
        <Text style={styles.stepCount}>{stepStr}</Text>
      </View>

      <Text style={styles.stepTitle}>{STEPS[step]}</Text>

      {step === 0 && (
        <View style={styles.templateGrid}>
          {TEMPLATES.map((t, i) => (
            <Animated.View
              key={t.id}
              entering={FadeInUp.delay(100 + i * 80).duration(400)}
            >
              <TouchableOpacity
                style={[
                  styles.templateTile,
                  selectedTemplate === t.id && styles.templateTileActive,
                ]}
                onPress={() => setSelectedTemplate(t.id)}
                activeOpacity={0.8}
              >
                {selectedTemplate === t.id && (
                  <Text style={styles.selectedGlyph}>◆</Text>
                )}
                <View style={styles.templateIcon}>{t.icon}</View>
                <Text style={styles.templateLabel}>{t.label}</Text>
                <Text style={styles.templateDesc}>{t.desc}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      {step === 1 && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
          <Text style={styles.limitLabel}>Max Daily Spend</Text>
          <Text style={styles.limitValue}>$800</Text>
          <View style={styles.limitSlider}>
            <View style={[styles.limitFill, { width: '40%' }]} />
          </View>
          <Text style={styles.limitHint}>Drag to adjust — we recommend starting at $800</Text>

          <View style={{ marginTop: spacing.xxl }}>
            <Text style={styles.limitLabel}>Max Per Transaction</Text>
            <Text style={styles.limitValue}>$250</Text>
            <View style={styles.limitSlider}>
              <View style={[styles.limitFill, { width: '25%' }]} />
            </View>
          </View>
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
          <Text style={styles.limitLabel}>Auto-Save Percentage</Text>
          <Text style={styles.limitValue}>15%</Text>
          <View style={styles.limitSlider}>
            <View style={[styles.limitFill, { width: '15%' }]} />
          </View>
          <Text style={styles.limitHint}>15% of every incoming transfer → USDC vault</Text>

          <View style={styles.vaultPreview}>
            <Text style={styles.vaultPreviewLabel}>PROJECTED MONTHLY SAVINGS</Text>
            <Text style={styles.vaultPreviewValue}>~$360 USDC</Text>
          </View>
        </Animated.View>
      )}

      {step === 3 && (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
          <Animated.View style={[styles.confirmCard, confirmStyle]}>
            <Text style={styles.confirmCardLabel}>TEMPLATE</Text>
            <Text style={styles.confirmCardValue}>{selectedTemplate?.toUpperCase()}</Text>
            <View style={styles.confirmDivider} />
            <Text style={styles.confirmCardLabel}>DAILY LIMIT</Text>
            <Text style={styles.confirmCardValue}>$800</Text>
            <View style={styles.confirmDivider} />
            <Text style={styles.confirmCardLabel}>AUTO-SAVE</Text>
            <Text style={styles.confirmCardValue}>15%</Text>
          </Animated.View>
        </Animated.View>
      )}

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>BACK</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextBtn, step === 0 && !selectedTemplate && styles.nextBtnDisabled]}
          activeOpacity={0.85}
          disabled={step === 0 && !selectedTemplate}
        >
          <Text style={[styles.nextBtnText, step === 0 && !selectedTemplate && styles.nextBtnTextDisabled]}>
            {step === 3 ? 'ARM WALLET' : 'CONTINUE'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  stepLabel: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 2,
  },
  stepCount: {
    fontFamily: theme.fontMonoBold,
    fontSize: 14,
    color: theme.accent,
  },
  stepTitle: {
    fontFamily: theme.fontDisplay,
    fontSize: 36,
    color: theme.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  templateTile: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  templateTileActive: {
    borderColor: theme.accent,
  },
  selectedGlyph: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontFamily: theme.fontMono,
    fontSize: 12,
    color: theme.accent,
  },
  templateIcon: {
    marginBottom: spacing.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateLabel: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.text,
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  templateDesc: {
    fontFamily: theme.fontMono,
    fontSize: 9,
    color: theme.muted,
    textAlign: 'center',
  },
  stepContent: {
    paddingHorizontal: spacing.lg,
  },
  limitLabel: {
    fontFamily: theme.fontBody,
    fontSize: 10,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  limitValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 36,
    color: theme.text,
    marginBottom: spacing.md,
  },
  limitSlider: {
    height: 6,
    backgroundColor: theme.border,
  },
  limitFill: {
    height: '100%',
    backgroundColor: theme.accent,
  },
  limitHint: {
    fontFamily: theme.fontMono,
    fontSize: 10,
    color: theme.textDim,
    marginTop: spacing.sm,
  },
  vaultPreview: {
    marginTop: spacing.xxl,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.lg,
  },
  vaultPreviewLabel: {
    fontFamily: theme.fontBody,
    fontSize: 9,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  vaultPreviewValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 20,
    color: theme.accent,
  },
  confirmCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.accent,
    padding: spacing.xl,
  },
  confirmCardLabel: {
    fontFamily: theme.fontBody,
    fontSize: 9,
    color: theme.muted,
    letterSpacing: 2,
    marginBottom: 2,
  },
  confirmCardValue: {
    fontFamily: theme.fontMonoBold,
    fontSize: 18,
    color: theme.text,
    marginBottom: spacing.sm,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    marginTop: 'auto',
    gap: spacing.md,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    flex: 1,
  },
  backBtnText: {
    fontFamily: theme.fontMono,
    fontSize: 12,
    color: theme.textDim,
    letterSpacing: 2,
  },
  nextBtn: {
    backgroundColor: theme.accent,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    flex: 2,
  },
  nextBtnDisabled: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  nextBtnText: {
    fontFamily: theme.fontMonoBold,
    fontSize: 12,
    color: theme.bg,
    letterSpacing: 2,
  },
  nextBtnTextDisabled: {
    color: theme.muted,
  },
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typewriterText: {
    fontFamily: theme.fontMonoBold,
    fontSize: 28,
    color: theme.accent,
    letterSpacing: 3,
    marginTop: spacing.xxl,
  },
  cursor: {
    color: theme.accent,
  },
});
