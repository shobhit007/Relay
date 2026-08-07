/**
 * Relay design tokens — keep in sync with `.cursor/rules/design.mdc` frontmatter.
 * Do not invent new colors, fonts, or radii outside this file.
 *
 * Kept outside `src/app` so Expo Router does not register it as a route.
 */

export const colors = {
  primaryBackground: '#000000',
  secondaryBackground: '#111111',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  primaryText: '#FFFFFF',
  secondaryText: '#A1A1AA',
  placeholder: '#71717A',
  success: '#22C55E',
  error: '#EF4444',
  accent: '#3B82F6',
};

/** Design font family name (Inter). Runtime faces are resolved via `textStyle()`. */
export const fontFamily = {
  sans: 'Inter',
};

/**
 * Loaded `@expo-google-fonts/inter` faces keyed by design font-weight.
 * Keep in sync with fonts loaded in `src/app/_layout.tsx`.
 */
export const fontFaces = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
};

export const typography = {
  'headline-lg': {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  'headline-lg-mobile': {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.26,
  },
  'headline-md': {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  'headline-sm': {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  'body-lg': {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 28,
  },
  'body-md': {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  'label-lg': {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: 0.28,
  },
  'label-sm': {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const radius = {
  sm: 4,
  DEFAULT: 8,
  buttons: 12,
  inputs: 12,
  cards: 16,
  bottomSheet: 24,
};

export const spacing = {
  base: 8,
  containerPaddingMobile: 20,
  containerPaddingDesktop: 64,
  gutter: 16,
  stackSm: 12,
  stackMd: 24,
  stackLg: 48,
};

/** Touch targets from design.mdc (min 48 / buttons 52). */
export const touch = {
  min: 48,
  button: 52,
};

/** Cap content width on tablets / large screens. */
export const layout = {
  maxContentWidth: 800,
  tabletBreakpoint: 768,
};

/**
 * Resolve a typography variant to a React Native Text style.
 * Maps design `Inter` + weight onto loaded expo-google-fonts faces.
 */
export function textStyle(variant) {
  const style = typography[variant];
  if (!style) {
    throw new Error(`Unknown typography variant: ${variant}`);
  }

  const { fontWeight, fontFamily: _designFamily, ...rest } = style;
  const face = fontFaces[fontWeight] ?? fontFaces[400];

  return {
    ...rest,
    fontFamily: face,
    fontWeight,
  };
}

export const tokens = {
  colors,
  typography,
  fontWeights,
  fontFamily,
  fontFaces,
  radius,
  spacing,
  touch,
  layout,
};

export default tokens;
