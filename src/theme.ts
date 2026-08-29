// Design tokens — see Phase 04 of the build spec.
// One primary (lime). Four accents, each with an assigned job.

export const C = {
  ink: '#0B0C12',
  ink2: '#0F1119',
  panel: '#151A2B',
  raise: '#232A42',

  line: 'rgba(255,255,255,0.09)',
  line2: 'rgba(255,255,255,0.16)',
  glass: 'rgba(255,255,255,0.055)',

  text: '#EAEDF6',
  dim: '#949AB4',
  faint: '#6B7191',

  lime: '#C6FF3D', // primary CTA — the only "press me" colour
  cyan: '#33E6FF', // live / network
  magenta: '#FF3DBE', // drink book
  amber: '#FFB43D', // warning / low
  violet: '#A855F7', // trending
} as const;

// Category accent — keeps the kit tiles legible at a glance.
export const CATEGORY_COLOR: Record<string, string> = {
  beverage: C.magenta,
  mixer: C.cyan,
  garnish: C.lime,
  flavor: C.violet,
  ice: '#7FD8FF',
  glass: '#B9C2E0',
  sweet: C.amber,
  tool: '#9BA3C4',
  vibe: '#FF7ED4',
};

export const LEVEL_COLOR: Record<string, string> = {
  full: C.lime,
  half: '#DDE85C',
  low: C.amber,
  out: C.faint,
};

export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const R = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

// Display face is loaded from @expo-google-fonts/nunito; body falls back to
// the platform sans, which is the right call on both iOS and Android.
export const F = {
  display: 'Nunito_800ExtraBold',
  displayMid: 'Nunito_700Bold',
  body: undefined as string | undefined,
  mono: undefined as string | undefined,
};

export const type = {
  h1: { fontSize: 32, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 13, lineHeight: 18 },
  label: { fontSize: 11, letterSpacing: 1.4 },
} as const;
