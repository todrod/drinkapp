import { CATALOG_BY_ID } from './catalog';
import { artForCatalog } from './art';
import { Category, DrinkRecipe } from '../types';

/**
 * The canonical liquid palette.
 *
 * These eleven colours are the ones in `scripts/assets/taxonomy.json`, which
 * is what the generated bottle renders are prompted against. Keeping the app
 * on the same vocabulary means a card, a bottle drawn in code, and a rendered
 * asset all agree on what "amber" is — change one and they drift.
 */
export const LIQUIDS = {
  clear: '#F2F6F5',
  'pale-gold': '#E8C87A',
  yellow: '#E8D24A',
  amber: '#C77B32',
  'dark-brown': '#6B3410',
  black: '#241C18',
  red: '#B0203A',
  orange: '#E2611E',
  green: '#4E7C3A',
  cream: '#E8DCC0',
  pink: '#D9738C',
} as const;

export type LiquidKey = keyof typeof LIQUIDS;

const ENTRIES = Object.entries(LIQUIDS) as [LiquidKey, string][];

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const snapCache = new Map<string, LiquidKey>();

/**
 * Snap an arbitrary colour to the nearest canonical liquid.
 *
 * `art.ts` carries a richer per-bottle palette — a cabinet full of subtly
 * different ambers is good — but anything that has to line up with a generated
 * asset goes through here first.
 */
export function snapToLiquid(hex: string): LiquidKey {
  const cached = snapCache.get(hex);
  if (cached) return cached;

  const [r, g, b] = rgb(hex);
  let best: LiquidKey = 'clear';
  let bestDist = Infinity;
  for (const [key, value] of ENTRIES) {
    const [r2, g2, b2] = rgb(value);
    // Weighted to human luminance sensitivity — plain Euclidean RGB snaps
    // warm ambers to black far too eagerly.
    const d = 2 * (r - r2) ** 2 + 4 * (g - g2) ** 2 + 3 * (b - b2) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }
  snapCache.set(hex, best);
  return best;
}

export function liquidForCatalog(catalogId: string | null, category: Category): LiquidKey {
  return snapToLiquid(artForCatalog(catalogId, category).liquid);
}

/**
 * A recipe's colour, taken from what it is actually made of.
 *
 * The base ingredient decides — a whiskey drink reads amber, a Negroni reads
 * red. Previously every card got a colour at random, which is why the library
 * looked like confetti rather than a menu.
 *
 * Note this uses `art.ts` colours directly rather than snapping to the eleven
 * canonical liquids. The canonical set is warm by design (real spirits are),
 * so snapping sends juniper-blue gin to cream and the card washes out. Snapping
 * is for lining up with a rendered asset; accents want the vivid value.
 */
function readsAsColour(hex: string): boolean {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // Enough saturation to be a hue, and not so pale it vanishes on a dark card.
  return max - min > 40 && (r + g + b) / 3 < 232;
}

export function accentForRecipe(r: DrinkRecipe): string {
  const ordered = [
    ...r.ingredients.filter((i) => i.role === 'base'),
    ...r.ingredients.filter((i) => i.role === 'modifier'),
    ...r.ingredients.filter((i) => i.role === 'mixer'),
    ...r.ingredients.filter((i) => i.role === 'sweetener'),
  ];

  for (const ing of ordered) {
    if (!ing.catalogItemId) continue;
    const cat = CATALOG_BY_ID[ing.catalogItemId];
    if (!cat) continue;
    const hex = artForCatalog(ing.catalogItemId, cat.category).liquid;
    if (readsAsColour(hex)) return hex;
  }

  return LIQUIDS['pale-gold'];
}
