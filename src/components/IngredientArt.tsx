import React from 'react';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
  Ellipse,
} from 'react-native-svg';
import { C } from '../theme';

/**
 * Illustrated ingredient art.
 *
 * Parametric SVG rather than an image pack: a silhouette chosen by what the
 * thing is, filled with a liquid colour chosen per ingredient. That keeps ~150
 * distinct icons at a few kilobytes of code, scales cleanly to any size, and
 * needs no licensing or network.
 *
 * Every shape draws into a 40x64 box: dark glass, liquid in the lower part, a
 * label band, and a highlight down the left edge.
 */

export type Shape =
  | 'tall'      // vodka, gin, agave — straight shoulders
  | 'wide'      // whiskey, rum — broad shoulders
  | 'wine'      // wine, vermouth, aperitivo — long neck
  | 'squat'     // liqueurs, amari
  | 'dasher'    // bitters
  | 'soda'      // tonic, soda, ginger beer
  | 'can'       // cola
  | 'carton'    // juice, dairy
  | 'squeeze'   // syrups
  | 'cup'       // coffee, tea
  | 'fruit'     // cherries, berries
  | 'wedge'     // citrus
  | 'leaf'      // herbs
  | 'cube'      // ice
  | 'glass'     // glassware
  | 'coupe'     // stemware
  | 'tool';     // barware

const BODY: Partial<Record<Shape, string>> = {
  tall: 'M16 4 h8 v14 c0 3 8 5 8 11 v29 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 v-29 c0 -6 8 -8 8 -11 z',
  wide: 'M16 6 h8 v10 c0 3 10 4 10 12 v30 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 v-30 c0 -8 10 -9 10 -12 z',
  wine: 'M17 2 h6 v18 c0 5 8 8 8 16 v22 a4 4 0 0 1 -4 4 h-14 a4 4 0 0 1 -4 -4 v-22 c0 -8 8 -11 8 -16 z',
  squat: 'M16 10 h8 v8 c0 3 9 4 9 11 v27 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 v-27 c0 -7 9 -8 9 -11 z',
  dasher: 'M17 10 h6 v8 c0 2 6 3 6 8 v24 a4 4 0 0 1 -4 4 h-10 a4 4 0 0 1 -4 -4 v-24 c0 -5 6 -6 6 -8 z',
  soda: 'M16 4 h8 v10 c0 4 9 5 9 13 c0 5 -3 6 -3 10 c0 4 3 5 3 10 v11 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 v-11 c0 -5 3 -6 3 -10 c0 -4 -3 -5 -3 -10 c0 -8 9 -9 9 -13 z',
  can: 'M11 8 h18 a3 3 0 0 1 3 3 v46 a3 3 0 0 1 -3 3 h-18 a3 3 0 0 1 -3 -3 v-46 a3 3 0 0 1 3 -3 z',
  carton: 'M10 16 l10 -6 l10 6 v42 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 z',
  squeeze: 'M15 8 h10 v7 c0 4 8 7 8 15 v26 a4 4 0 0 1 -4 4 h-18 a4 4 0 0 1 -4 -4 v-26 c0 -8 8 -11 8 -15 z',
  cup: 'M9 20 h22 l-3 38 a4 4 0 0 1 -4 3 h-8 a4 4 0 0 1 -4 -3 z',
  glass: 'M10 20 h20 l-2 38 a4 4 0 0 1 -4 3 h-8 a4 4 0 0 1 -4 -3 z',
};

/** How full the liquid sits, as a fraction of the 64-unit box from the bottom. */
const FILL: Partial<Record<Shape, number>> = {
  tall: 0.78, wide: 0.76, wine: 0.74, squat: 0.72, dasher: 0.68,
  soda: 0.82, can: 0.86, carton: 0.8, squeeze: 0.74, cup: 0.6, glass: 0.55,
};

export function IngredientArt({
  shape,
  liquid,
  size = 34,
}: {
  shape: Shape;
  liquid: string;
  size?: number;
}) {
  const w = size * (40 / 64);
  const common = { width: w, height: size, viewBox: '0 0 40 64' } as const;

  // ── Non-bottle shapes ──────────────────────────────────────────────────
  if (shape === 'fruit') {
    return (
      <Svg {...common}>
        <Path d="M20 18 q3 -8 8 -10" stroke="#4F7A3A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Circle cx={15} cy={38} r={12} fill={liquid} />
        <Circle cx={27} cy={44} r={10} fill={liquid} opacity={0.82} />
        <Circle cx={11} cy={33} r={3.4} fill="#FFFFFF" opacity={0.4} />
      </Svg>
    );
  }

  if (shape === 'wedge') {
    return (
      <Svg {...common}>
        <Path d="M6 46 a20 20 0 0 1 28 0 z" fill={liquid} />
        <Path d="M9 45 a17 17 0 0 1 22 0 z" fill="#FFFFFF" opacity={0.22} />
        {[0, 1, 2, 3].map((i) => (
          <Path
            key={i}
            d={`M20 46 L${10 + i * 6.7} ${46 - Math.sqrt(Math.max(0, 196 - (10 + i * 6.7 - 20) ** 2))}`}
            stroke={C.ink}
            strokeWidth={1.1}
            opacity={0.35}
          />
        ))}
      </Svg>
    );
  }

  if (shape === 'leaf') {
    return (
      <Svg {...common}>
        <Path d="M20 8 c14 10 14 30 0 46 c-14 -16 -14 -36 0 -46 z" fill={liquid} />
        <Path d="M20 12 v38" stroke={C.ink} strokeWidth={1.4} opacity={0.35} />
        <Path d="M20 22 l7 -5 M20 32 l7 -5 M20 22 l-7 -5 M20 32 l-7 -5" stroke={C.ink} strokeWidth={1.1} opacity={0.28} />
      </Svg>
    );
  }

  if (shape === 'cube') {
    return (
      <Svg {...common}>
        <Path d="M8 24 l12 -7 l12 7 v22 l-12 7 l-12 -7 z" fill={liquid} opacity={0.55} />
        <Path d="M8 24 l12 7 l12 -7" stroke="#FFFFFF" strokeWidth={1.6} fill="none" opacity={0.6} />
        <Path d="M20 31 v22" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.45} />
        <Path d="M12 26 l6 3" stroke="#FFFFFF" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
      </Svg>
    );
  }

  if (shape === 'coupe') {
    return (
      <Svg {...common}>
        <Path d="M8 20 h24 a12 12 0 0 1 -24 0 z" fill={liquid} />
        <Path d="M8 20 h24 a12 12 0 0 1 -24 0 z" stroke="#FFFFFF" strokeWidth={1.6} fill="none" opacity={0.75} />
        <Path d="M20 32 v18" stroke="#FFFFFF" strokeWidth={2} opacity={0.75} />
        <Path d="M12 52 h16" stroke="#FFFFFF" strokeWidth={2.4} opacity={0.75} strokeLinecap="round" />
      </Svg>
    );
  }

  if (shape === 'tool') {
    return (
      <Svg {...common}>
        <Path d="M13 12 h14 l-1 7 h-12 z" fill={liquid} />
        <Path d="M12 21 h16 l-2 34 a4 4 0 0 1 -4 3 h-4 a4 4 0 0 1 -4 -3 z" fill={liquid} opacity={0.85} />
        <Path d="M12 21 h16 l-2 34 a4 4 0 0 1 -4 3 h-4 a4 4 0 0 1 -4 -3 z" stroke="#FFFFFF" strokeWidth={1.3} fill="none" opacity={0.5} />
        <Rect x={15} y={26} width={3.4} height={22} rx={1.7} fill="#FFFFFF" opacity={0.28} />
      </Svg>
    );
  }

  // ── Bottle-family shapes ───────────────────────────────────────────────
  const d = BODY[shape] ?? BODY.tall!;
  const fillFrac = FILL[shape] ?? 0.6;
  const liquidTop = 64 - 64 * fillFrac;
  const clipId = `clip-${shape}`;

  return (
    <Svg {...common}>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
      </Defs>

      {/* dark glass */}
      <Path d={d} fill="#0E1A21" />

      <G clipPath={`url(#${clipId})`}>
        {/* liquid */}
        <Rect x={0} y={liquidTop} width={40} height={64 - liquidTop} fill={liquid} />
        {/* meniscus */}
        <Ellipse cx={20} cy={liquidTop} rx={16} ry={2} fill="#FFFFFF" opacity={0.18} />
        {/* label band — kept narrow so the liquid colour still reads at 24px */}
        <Rect x={0} y={42} width={40} height={10} fill="#F5F1E6" opacity={0.94} />
        <Rect x={0} y={42} width={40} height={1.8} fill={C.teal} opacity={0.9} />
        <Rect x={0} y={50.2} width={40} height={1.8} fill="#C9A227" opacity={0.95} />
        {/* highlight */}
        <Rect x={9.5} y={6} width={3.6} height={52} rx={1.8} fill="#FFFFFF" opacity={0.16} />
      </G>

      {/* rim */}
      <Path d={d} stroke="rgba(190,235,235,0.45)" strokeWidth={1.4} fill="none" />
      {/* cap */}
      <Rect
        x={shape === 'can' || shape === 'carton' ? 11 : 15}
        y={shape === 'dasher' ? 4 : shape === 'wine' ? 0 : 2}
        width={shape === 'can' || shape === 'carton' ? 18 : 10}
        height={6}
        rx={2}
        fill="#C9A227"
        opacity={0.95}
      />
    </Svg>
  );
}
