import { Platform, StyleSheet } from 'react-native';

export const T = {
  bg: '#0A0A0B',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  ink: '#FFFFFF',
  inkMuted: '#8E8E93',
  inkFaint: '#48484A',
  accent: '#7C3AED',
  accentLight: '#A78BFA',
  accentDark: '#5B21B6',
  danger: '#FF453A',
  safe: '#30D158',
  warning: '#FFD60A',
  border: '#38383A',
  borderSubtle: '#242426',

  fontFamily: 'Inter_400Regular',
  fontSemiBold: 'Inter_600SemiBold',
  fontBold: 'Inter_700Bold',
  fontMedium: 'Inter_500Medium',
  fontLight: 'Inter_300Light',
  fontMono: Platform.select({ ios: 'Menlo', default: 'monospace' }),

  s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 48, s8: 64,
  s2_5: 20,

  radius: 12,
  radiusSmall: 8,
  radiusSm: 8,
  radiusFull: 9999,
  hairline: StyleSheet.hairlineWidth,
} as const;

export type Theme = typeof T;

export function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(2) + 'K';
  return n.toFixed(2);
}
