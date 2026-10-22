import { Platform } from 'react-native';

// Design tokens.
//
// Black surfaces, deep red controls, and bright neutral text.

export const C = {
  // Ground gets three steps so panels can sit *on* something rather than float
  // on one flat colour.
  ink: '#050505',
  ink2: '#0D0D0F',
  ink3: '#161618',
  panel: '#151517',
  raise: '#340D13',
  ambient: '#CF102A',

  line: 'rgba(255, 255, 255, 0.16)',
  line2: 'rgba(255, 255, 255, 0.30)',
  /** The 1px light catch along the top of a raised surface. */
  edge: 'rgba(255, 255, 255, 0.12)',
  /** Flat translucent fill for surfaces that do not warrant a gradient. */
  glass: 'rgba(255, 255, 255, 0.04)',

  text: '#FFFFFF',
  dim: '#E2E2E5',
  faint: '#C5C5CD',
  accent: '#E83A4F',
  accentSoft: '#CF253B',
  accentDeep: '#AA1028',
  onAccent: '#FFFFFF',

  teal: '#A5D6C5',
  tealSoft: '#C3E6D9',
  tealDeep: '#487E6B',
  cyan: '#A2CEE4',
  amber: '#F2BE7F',
  gold: '#E3BD80',
  rose: '#EEA6B5',
  violet: '#B6A5EC',
} as const;

/** Translucent fills for glass surfaces, lightest at the top of the stack. */
export const GLASS = {
  card: ['#1A1A1D', '#101012'] as const,
  raised: ['#261014', '#160E10'] as const,
  sheet: ['#1C1215', '#0E0E10'] as const,
  hero: ['#430B15', '#200A0F', '#0B0B0D'] as const,
  primary: ['#CF253B', '#BD1730', '#A71027'] as const,
};

/**
 * Shadows.
 *
 * React Native Web does not honour `shadowRadius`, so the native shadow props
 * render as a hard offset rectangle rather than a blur. Web gets a real
 * `boxShadow` string instead; native keeps the props it understands.
 */
const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function shadow(color: string, opacity: number, radius: number, y: number, elevation: number) {
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${y}px ${radius}px ${rgba(color, opacity)}` } as any;
  }
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: y },
    elevation,
  };
}

export const SHADOW = {
  card: shadow('#000000', 0.12, 12, 4, 3),
  lift: shadow('#000000', 0.3, 28, 12, 8),
  glow: (color: string, strength = 0.55) => shadow(color, strength, 20, 0, 8),
};

export const ACCENTS = [C.teal, C.cyan, C.violet, C.amber, C.rose];

export const CATEGORY_COLOR: Record<string, string> = {
  beverage: C.teal,
  mixer: C.cyan,
  garnish: C.tealSoft,
  flavor: C.violet,
  ice: '#8FD8EC',
  glass: '#AEC4CE',
  sweet: C.amber,
  tool: '#7E96A2',
  vibe: C.rose,
};

export const LEVEL_COLOR: Record<string, string> = {
  full: C.teal,
  half: C.tealSoft,
  low: C.amber,
  out: C.faint,
};

export const LEVEL_FILL: Record<string, number> = {
  full: 1,
  half: 0.6,
  low: 0.28,
  out: 0.04,
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 36 } as const;
export const R = { sm: 10, md: 18, lg: 24, xl: 32, pill: 999 } as const;

export const SCREEN = {
  width: '100%', maxWidth: 1120, alignSelf: 'center',
  padding: 24, paddingTop: 28, paddingBottom: 32,
} as const;

/**
 * Outfit provides clear headings and a relaxed editorial hierarchy without
 * adding another font family to the offline bundle.
 */
export const F = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_600SemiBold',
};

export const type = {
  wordmark: { fontFamily: F.semibold, fontSize: 32, letterSpacing: -0.8 },
  h1: { fontFamily: F.semibold, fontSize: 26, lineHeight: 31, letterSpacing: 0.4 },
  h2: { fontFamily: F.semibold, fontSize: 21, lineHeight: 26, letterSpacing: 0.2 },
  h3: { fontFamily: F.medium, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: F.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: F.medium, fontSize: 11, letterSpacing: 1.3 },
  mono: { fontFamily: F.medium, fontSize: 11, letterSpacing: 0.6 },
} as const;
