// Design tokens.
//
// Teal-on-near-black, after the Mixologist reference: one aqua primary, a
// smoky blue-black ground, and warm accents held back for state (low stock,
// destructive) rather than decoration.

export const C = {
  ink: '#070B11',
  ink2: '#0B1219',
  panel: '#101A22',
  raise: '#17242E',

  line: 'rgba(140, 220, 220, 0.10)',
  line2: 'rgba(140, 220, 220, 0.22)',
  glass: 'rgba(190, 245, 245, 0.045)',

  text: '#E6F1F4',
  dim: '#8FA8B2',
  faint: '#5C7480',

  teal: '#35D6C4', // primary — the only "press me" colour
  tealSoft: '#6EE7DB',
  tealDeep: '#1B8C86',
  cyan: '#5BC8E8', // information, live state
  amber: '#E8B54A', // low stock, warnings
  rose: '#E86A8A', // destructive, missing
  violet: '#9D8CF0', // themed collections
} as const;

// Per-drink card accents, retuned to sit inside the aqua palette.
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

/** Fraction of the quantity bar each level fills. */
export const LEVEL_FILL: Record<string, number> = {
  full: 1,
  half: 0.6,
  low: 0.28,
  out: 0.04,
};

/**
 * Recipe accents were authored against the previous lime/magenta palette and
 * are persisted in the database, so they cannot simply be edited in the data
 * files. Map them at render time instead.
 */
const LEGACY_ACCENT: Record<string, string> = {
  '#C6FF3D': C.teal,
  '#33E6FF': C.cyan,
  '#FF3DBE': C.rose,
  '#FFB43D': C.amber,
  '#A855F7': C.violet,
  '#EAEDF6': C.tealSoft,
};

export const accentOf = (hex: string): string =>
  LEGACY_ACCENT[(hex || '').toUpperCase()] ?? hex;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const R = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;

export const F = {
  display: 'Nunito_800ExtraBold',
  displayMid: 'Nunito_700Bold',
  body: undefined as string | undefined,
};

export const type = {
  h1: { fontSize: 30, lineHeight: 34, letterSpacing: -0.4 },
  h2: { fontSize: 23, lineHeight: 27, letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 11, letterSpacing: 1.5 },
} as const;
