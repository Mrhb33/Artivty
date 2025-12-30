import type { TextStyle } from 'react-native';

// Design System - Single Source of Truth for Artivty V1
// Professional art marketplace design tokens

export const COLORS = {
  // Primary Brand Colors
  accent: {
    primary: '#D4AF37',    // Gold
    secondary: '#B8860B',  // Dark Goldenrod
    danger: '#FF5A5F',     // Soft Red
    success: '#2EC4B6',    // Teal
    warning: '#F89E1A',    // Orange
  },

  // Neutral Palette
  background: {
    primary: '#0D0F19',    // Deep Navy
    secondary: '#171F34',  // Dark Blue-Gray
    tertiary: '#21284D',   // Medium Blue-Gray
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',    // Pure White
    secondary: 'rgba(255,255,255,0.8)', // High contrast white
    tertiary: 'rgba(255,255,255,0.6)',  // Medium contrast white
    inverse: '#0D0F19',    // For text on light backgrounds
  },

  // Surface Colors
  surface: {
    primary: 'rgba(255,255,255,0.04)',
    secondary: 'rgba(255,255,255,0.08)',
    tertiary: 'rgba(255,255,255,0.12)',
    elevated: 'rgba(255,255,255,0.08)',
    pressed: 'rgba(255,255,255,0.12)',
    disabled: 'rgba(255,255,255,0.04)',
  },

  // Border Colors
  border: {
    light: 'rgba(255,255,255,0.08)',
    subtle: 'rgba(255,255,255,0.08)',
    medium: 'rgba(255,255,255,0.12)',
    strong: 'rgba(255,255,255,0.2)',
  },
} as const;

export const SPACING = {
  micro: 2,
  tiny: 4,
  xs: 8,
  small: 8,
  sm: 12,
  md: 16,
  medium: 16,
  lg: 24,
  large: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  screen: 16,
  screenLg: 20,
  content: 16,
  contentSm: 12,
} as const;

export const BORDER_RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  xxl: 32,
  full: 9999, // For pill shapes
} as const;

const FONT_FAMILIES = {
  primary: 'System',
  secondary: 'System',
} as const;

const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
  '5xl': 36,
  '6xl': 48,
} as const;

const FONT_WEIGHTS = {
  thin: '100' as const,
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '900' as const,
} as const;

const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

const TYPOGRAPHY_VARIANTS: Record<string, TextStyle> = {
  hero: {
    fontFamily: FONT_FAMILIES.primary,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: -1,
  },
  heroArabic: {
    fontFamily: FONT_FAMILIES.secondary,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: FONT_FAMILIES.primary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0,
  },
  titleArabic: {
    fontFamily: FONT_FAMILIES.secondary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.primary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 0,
  },
  subtitleArabic: {
    fontFamily: FONT_FAMILIES.secondary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: FONT_WEIGHTS.medium,
    letterSpacing: 0.25,
  },
  body: {
    fontFamily: FONT_FAMILIES.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: 0,
  },
  bodyArabic: {
    fontFamily: FONT_FAMILIES.secondary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: FONT_FAMILIES.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: 0.5,
  },
  captionArabic: {
    fontFamily: FONT_FAMILIES.secondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: 0.4,
  },
  micro: {
    fontFamily: FONT_FAMILIES.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: 0.5,
  },
  microArabic: {
    fontFamily: FONT_FAMILIES.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FONT_WEIGHTS.normal,
    letterSpacing: 0.3,
  },
};

export const TYPOGRAPHY = {
  fontFamily: FONT_FAMILIES,
  fontSize: FONT_SIZES,
  fontWeight: FONT_WEIGHTS,
  lineHeight: LINE_HEIGHTS,
  letterSpacing: LETTER_SPACING,
  hero: TYPOGRAPHY_VARIANTS.hero,
  heroArabic: TYPOGRAPHY_VARIANTS.heroArabic,
  title: TYPOGRAPHY_VARIANTS.title,
  titleArabic: TYPOGRAPHY_VARIANTS.titleArabic,
  subtitle: TYPOGRAPHY_VARIANTS.subtitle,
  subtitleArabic: TYPOGRAPHY_VARIANTS.subtitleArabic,
  body: TYPOGRAPHY_VARIANTS.body,
  bodyArabic: TYPOGRAPHY_VARIANTS.bodyArabic,
  caption: TYPOGRAPHY_VARIANTS.caption,
  captionArabic: TYPOGRAPHY_VARIANTS.captionArabic,
  micro: TYPOGRAPHY_VARIANTS.micro,
  microArabic: TYPOGRAPHY_VARIANTS.microArabic,
} as const;

export const SHADOWS = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: COLORS.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 0,
  },
} as const;

export const COMPONENT_TOKENS = {
  // Screen padding helpers
  screen: {
    padding: SPACING.large,
  },

  // Button Variants
  button: {
    height: {
      small: 40,
      medium: 48,
      large: 56,
    },
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.large,
  },

  // Input Variants
  input: {
    height: 56,
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.large,
    fontSize: TYPOGRAPHY.fontSize.lg,
  },

  // Card Variants
  card: {
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.large,
    shadow: SHADOWS.subtle,
  },

  // Modal Variants
  modal: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
  },

  // Avatar Sizes
  avatar: {
    small: 32,
    medium: 48,
    large: 64,
    xl: 96,
  },

  // Spacing Scale for Components
  componentSpacing: {
    xs: SPACING.tiny,
    sm: SPACING.small,
    md: SPACING.medium,
    lg: SPACING.large,
    xl: SPACING.xl,
  },
} as const;

// Type exports for better TypeScript support
export type ColorScheme = typeof COLORS;
export type SpacingScale = typeof SPACING;
export type BorderRadiusScale = typeof BORDER_RADIUS;
export type TypographyScale = typeof TYPOGRAPHY;
export type ShadowTokens = typeof SHADOWS;
export type ComponentTokens = typeof COMPONENT_TOKENS;
export type TypographyVariant = keyof typeof TYPOGRAPHY_VARIANTS;

export const getTypography = (variant: TypographyVariant): TextStyle => {
  return TYPOGRAPHY_VARIANTS[variant] ?? TYPOGRAPHY_VARIANTS.body;
};

export const getColor = (path: string): string => {
  const segments = path.split('.');
  let current: any = COLORS;

  for (const segment of segments) {
    if (current && segment in current) {
      current = current[segment as keyof typeof current];
    } else {
      return COLORS.text.primary;
    }
  }

  return typeof current === 'string' ? current : COLORS.text.primary;
};
