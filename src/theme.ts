import { Platform } from 'react-native';

// Design tokens.
//
// Teal-on-near-black. The look leans on four things rather than colour alone:
// layered translucency, a light edge on every raised surface, real shadow, and
// a grain overlay — flat fills on flat ground are what read as unfinished.

export const C = {
  // Ground gets three steps so panels can sit *on* something rather than float
  // on one flat colour.
  ink: '#05090D',
  ink2: '#080E14',
  ink3: '#0B141B',
  panel: '#0F1A22',
  raise: '#152430',

  line: 'rgba(150, 226, 224, 0.09)',
  line2: 'rgba(150, 226, 224, 0.20)',
  /** The 1px light catch along the top of a raised surface. */
  edge: 'rgba(190, 250, 246, 0.16)',
  /** Flat translucent fill for surfaces that do not warrant a gradient. */
  glass: 'rgba(190, 250, 246, 0.05)',

  text: '#EAF4F6',
  dim: '#93AEB7',
  // 5.13:1 on the ground — the previous #5D7783 was 3.92 and failed AA.
  faint: '#6E8B96',

  teal: '#2FD4C6',
  tealSoft: '#7BEFE2',
  tealDeep: '#12706C',
  cyan: '#54C7EA',
  amber: '#E5B457',
  gold: '#C9A227',
  rose: '#E86A8C',
  violet: '#9E8CF2',
} as const;

/** Translucent fills for glass surfaces, lightest at the top of the stack. */
export const GLASS = {
  card: ['rgba(190, 250, 246, 0.075)', 'rgba(190, 250, 246, 0.018)'] as const,
  raised: ['rgba(190, 250, 246, 0.11)', 'rgba(190, 250, 246, 0.03)'] as const,
  sheet: ['rgba(22, 40, 50, 0.96)', 'rgba(10, 20, 27, 0.98)'] as const,
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
  card: shadow('#000000', 0.45, 18, 10, 6),
  lift: shadow('#000000', 0.55, 28, 16, 12),
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
export const R = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;

/**
 * Outfit — geometric, and available in weights light enough for the wide
 * letter-spaced treatment the design calls for. The previous rounded
 * extra-bold face was working against it.
 */
export const F = {
  light: 'Outfit_300Light',
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
};

export const type = {
  wordmark: { fontFamily: F.light, fontSize: 30, letterSpacing: 7 },
  h1: { fontFamily: F.semibold, fontSize: 26, lineHeight: 31, letterSpacing: 0.4 },
  h2: { fontFamily: F.semibold, fontSize: 21, lineHeight: 26, letterSpacing: 0.2 },
  h3: { fontFamily: F.medium, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: F.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: F.semibold, fontSize: 10.5, letterSpacing: 1.8 },
  mono: { fontFamily: F.medium, fontSize: 11, letterSpacing: 0.6 },
} as const;
