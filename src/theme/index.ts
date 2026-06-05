export const theme = {
  bg: '#0A0A08',
  surface: '#1C1C18',
  surfaceAlt: '#22221C',
  border: '#2A2A22',
  accent: '#C8F135',
  accentDim: '#8FB321',
  warning: '#FF6B2B',
  warningDim: '#B84D1E',
  muted: '#5A5A50',
  mutedLight: '#7A7A6A',
  text: '#E8E8D8',
  textDim: '#B8B8A8',

  green: '#4ADE80',
  amber: '#FBBF24',
  red: '#FF4B4B',

  fontDisplay: 'DMSerifDisplay_400Regular',
  fontDisplayRegular: 'DMSerifDisplay_400Regular',
  fontMono: 'JetBrainsMono_400Regular',
  fontMonoBold: 'JetBrainsMono_700Bold',
  fontBody: 'Syne_400Regular',
  fontBodyMedium: 'Syne_500Medium',
  fontBodyBold: 'Syne_700Bold',

  radius: 0,
  radiusChip: 2,

  clipCorner: 14,
} as const;

export type Theme = typeof theme;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const opacity = {
  subtle: 0.08,
  light: 0.12,
  medium: 0.2,
  strong: 0.4,
  intense: 0.6,
} as const;
