import { StyleSheet } from 'react-native';

export const T = {
  bg: '#F5F0E8',
  surface: '#EDE8DE',
  surfaceDeep: '#E2DDD3',
  ink: '#1A1814',
  inkMuted: '#7A7368',
  inkFaint: '#B8B0A4',
  gold: '#B8960C',
  goldLight: '#D4AF3A',
  danger: '#8B2E2E',
  safe: '#2E5C3E',
  border: '#D4CFC6',

  fontDisplay: 'PlayfairDisplay_400Regular',
  fontDisplayItalic: 'PlayfairDisplay_400Regular_Italic',
  fontDisplayBold: 'PlayfairDisplay_700Bold',
  fontDisplayBoldItalic: 'PlayfairDisplay_700Bold_Italic',
  fontFigures: 'CormorantGaramond_400Regular_Italic',
  fontFiguresBold: 'CormorantGaramond_700Bold_Italic',
  fontBody: 'LibreBaskerville_400Regular',
  fontBodyBold: 'LibreBaskerville_700Bold',
  fontBodyItalic: 'LibreBaskerville_400Regular_Italic',
  fontMono: 'CourierPrime_400Regular',
  fontMonoBold: 'CourierPrime_700Bold',

  s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 48, s8: 64,

  radius: 4,
  radiusNone: 0,
  hairline: StyleSheet.hairlineWidth,
  accentBar: 3,
} as const;

export type Theme = typeof T;

export function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  let remaining = n;
  for (const [val, sym] of map) {
    while (remaining >= val) {
      result += sym;
      remaining -= val;
    }
  }
  return result || 'I';
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
