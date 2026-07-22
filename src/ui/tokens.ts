export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'tv';

type TokenScale<TKeys extends string, TValue = string> = Record<TKeys, TValue>;

type SpacingKey = '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type RadiusKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ShadowKey = 'soft' | 'card' | 'elevated';
type FontSizeKey = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
type LineHeightKey = 'tight' | 'snug' | 'base' | 'relaxed' | 'loose';
type FontWeightKey = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

type ColorKey =
  | 'page'
  | 'surface'
  | 'surfaceMuted'
  | 'surfaceStrong'
  | 'borderSubtle'
  | 'borderStrong'
  | 'accent'
  | 'accentSoft'
  | 'accentStrong'
  | 'danger'
  | 'dangerSoft'
  | 'warning'
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverted';

export const colors: TokenScale<ColorKey> = {
  page: '#f1f5f9',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceStrong: '#e2e8f0',
  borderSubtle: 'rgba(148, 163, 184, 0.28)',
  borderStrong: 'rgba(30, 64, 175, 0.45)',
  accent: '#22c55e',
  accentSoft: 'rgba(34, 197, 94, 0.12)',
  accentStrong: '#047857',
  danger: '#ef4444',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  warning: '#facc15',
  textPrimary: '#0f172a',
  textSecondary: 'rgba(15, 23, 42, 0.74)',
  textMuted: 'rgba(15, 23, 42, 0.52)',
  textInverted: '#ffffff',
};

export const spacing: TokenScale<SpacingKey> = {
  '3xs': '0.125rem',
  '2xs': '0.25rem',
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const radii: TokenScale<RadiusKey> = {
  xs: '0.35rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '999px',
};

export const shadows: TokenScale<ShadowKey> = {
  soft: '0 20px 40px rgba(15, 23, 42, 0.08)',
  card: '0 32px 60px rgba(15, 118, 110, 0.12)',
  elevated: '0 40px 80px rgba(15, 23, 42, 0.16)',
};

export const fontSizes: TokenScale<FontSizeKey> = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.5rem',
  '2xl': '2rem',
  '3xl': '2.5rem',
  '4xl': '3.25rem',
};

export const lineHeights: TokenScale<LineHeightKey> = {
  tight: '1.2',
  snug: '1.35',
  base: '1.5',
  relaxed: '1.65',
  loose: '1.8',
};

export const fontWeights: TokenScale<FontWeightKey, number> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const breakpoints: TokenScale<BreakpointKey, number> = {
  xs: 360,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
  tv: 1920,
};

export const media = {
  up: (key: BreakpointKey) => `@media (min-width: ${breakpoints[key]}px)`,
};

export const layout = {
  maxContentWidth: '1200px',
  maxPageWidth: '1400px',
};

export const motion = {
  transitionFast: '120ms ease',
  transitionBase: '180ms ease',
};

export type Tokens = {
  colors: typeof colors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  fontSizes: typeof fontSizes;
  lineHeights: typeof lineHeights;
  fontWeights: typeof fontWeights;
  breakpoints: typeof breakpoints;
  layout: typeof layout;
  motion: typeof motion;
};

export const tokens: Tokens = {
  colors,
  spacing,
  radii,
  shadows,
  fontSizes,
  lineHeights,
  fontWeights,
  breakpoints,
  layout,
  motion,
};

export const px = (value: number) => `${value}px`;

export const rem = (value: number) => `${value}rem`;
