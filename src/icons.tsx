import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
// Direct module path, not the package index: importing '@expo/vector-icons'
// pulls in every icon set and therefore every bundled font — about 4 MB of
// TTFs for the handful of glyphs this app draws.
import createIconSet from '@expo/vector-icons/build/createIconSet';
import glyphMap from './generated/glyphmap.json';
import { CATALOG_BY_ID } from './data/catalog';
import { Category, DrinkRecipe } from './types';
import { C } from './theme';

/**
 * Icons.
 *
 * MaterialCommunityIcons ships inside @expo/vector-icons — free, offline, and
 * with real barware glyphs (shaker, keg, hops, every glass shape) rather than
 * generic food icons.
 *
 * The full face is 1.3 MB for 7,448 glyphs and this app draws about fifty, so
 * `scripts/build-icon-font.py` subsets it to 12 KB. GlyphName is keyed off the
 * generated map, which means referencing an icon that is not in the subset is
 * a type error rather than a blank box at runtime.
 *
 * Catalog items resolve by id first, then by kind, then by category, so a
 * free-typed custom item still gets something sensible.
 */

export type GlyphName = keyof typeof glyphMap;

/** App.tsx also registers the face via useFonts so nothing paints before it. */
const ShakerIcon = createIconSet(
  glyphMap as Record<string, number>,
  'ShakerIcons',
  require('../assets/fonts/ShakerIcons.ttf')
);

export function Icon({
  name,
  size = 20,
  color = C.text,
  style,
}: {
  name: GlyphName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <ShakerIcon name={name as string} size={size} color={color} style={style} />;
}

export const TAB_ICON: Record<string, GlyphName> = {
  random: 'shuffle-variant',
  cabinet: 'cupboard',
  recipes: 'book-open-variant',
  builder: 'glass-cocktail',
};

export const CATEGORY_GLYPH: Record<Category, GlyphName> = {
  beverage: 'bottle-wine',
  mixer: 'bottle-soda-classic',
  garnish: 'fruit-citrus',
  flavor: 'leaf',
  ice: 'snowflake',
  glass: 'glass-cocktail',
  sweet: 'bottle-tonic-plus',
  tool: 'silverware-variant',
  vibe: 'party-popper',
};

/** Per-item overrides where the generic shape would be misleading. */
const BY_ID: Record<string, GlyphName> = {
  // Glassware
  'gl-rocks': 'cup',
  'gl-highball': 'glass-stange',
  'gl-collins': 'glass-stange',
  'gl-coupe': 'glass-tulip',
  'gl-martini': 'glass-cocktail',
  'gl-flute': 'glass-flute',
  'gl-mug': 'glass-mug',
  'gl-hurricane': 'glass-tulip',

  // Tools
  'tl-shaker': 'shaker',
  'tl-jigger': 'cup-outline',
  'tl-strainer': 'filter-variant',
  'tl-muddler': 'gavel',
  'tl-barspoon': 'silverware-variant',
  'tl-peeler': 'knife',

  // Ice
  'ic-cubes': 'snowflake',
  'ic-crushed': 'snowflake-variant',
  'ic-big-cube': 'cube-outline',

  // Juices and dairy read better as their source than as a soda bottle
  'mx-oj': 'fruit-citrus',
  'mx-lime-juice': 'fruit-citrus',
  'mx-lemon-juice': 'fruit-citrus',
  'mx-grapefruit': 'fruit-citrus',
  'mx-pineapple': 'fruit-pineapple',
  'mx-cranberry': 'fruit-cherries',
  'mx-tomato': 'bowl-mix',
  'mx-milk': 'cup',
  'mx-cream': 'cup',
  'mx-half-and-half': 'cup',
  'mx-creamer': 'cup',
  'mx-coconut-cream': 'bowl-mix',
  'mx-espresso': 'coffee',
  'mx-cold-brew': 'coffee',
  'mx-black-tea': 'tea',
  'mx-iced-tea': 'tea',
  'mx-lemonade': 'cup-water',

  // Flavour shelf
  'fl-mint': 'leaf',
  'fl-basil': 'leaf',
  'fl-cucumber': 'leaf',
  'fl-jalapeno': 'chili-hot',
  'fl-salt': 'shaker-outline',
  'fl-pepper': 'shaker-outline',
  'fl-hot-sauce': 'chili-hot',
  'fl-worcestershire': 'soy-sauce',

  // Garnish
  'gn-lime': 'fruit-citrus',
  'gn-lemon': 'fruit-citrus',
  'gn-orange': 'fruit-citrus',
  'gn-cherry': 'fruit-cherries',
  'gn-olive': 'circle-slice-8',
  'gn-celery': 'leaf',
  'gn-pineapple': 'fruit-pineapple',
  'gn-strawberry': 'fruit-cherries',
  'gn-watermelon': 'fruit-watermelon',

  // Vibe
  'vb-rim-salt': 'shaker-outline',
  'vb-straws': 'cup',
  'vb-umbrella': 'umbrella',
  'vb-sparkler': 'party-popper',

  // Beer & wine
  'br-stout': 'beer',
  'br-lager': 'glass-pint-outline',
  'br-pumpkin-ale': 'beer',
  'wn-prosecco': 'bottle-wine',
  'wn-champagne': 'bottle-wine',
  'wn-red': 'glass-wine',
  'wn-white': 'glass-wine',
  'wn-madeira': 'glass-wine',

  // Distinctive bottles
  'lq-absinthe': 'flask-round-bottom',
  'lq-falernum': 'bottle-tonic',
  'lq-allspice': 'bottle-tonic',
  'sw-orgeat': 'bottle-tonic-plus',
  'sw-sugar': 'candy',
  'sw-honey': 'beehive-outline',
};

const BY_KIND: Record<string, GlyphName> = {
  spirit: 'liquor',
  liqueur: 'bottle-tonic',
  wine: 'glass-wine',
  beer: 'beer',
  mixer: 'bottle-soda-classic',
  syrup: 'bottle-tonic-plus',
  bitters: 'spray-bottle',
  garnish: 'fruit-citrus',
  ice: 'snowflake',
  tool: 'silverware-variant',
  glass: 'glass-cocktail',
  extra: 'party-popper',
};

export function glyphForCatalog(catalogId: string | null, category: Category): GlyphName {
  if (catalogId) {
    if (BY_ID[catalogId]) return BY_ID[catalogId];
    const cat = CATALOG_BY_ID[catalogId];
    if (cat && BY_KIND[cat.kind]) return BY_KIND[cat.kind];
  }
  return CATEGORY_GLYPH[category] ?? 'bottle-wine';
}

/** The big glyph on a recipe card — chosen by what it's served in. */
export function glyphForRecipe(r: DrinkRecipe): GlyphName {
  if (r.method === 'blend') return 'blender';
  if (r.glass && BY_ID[r.glass]) return BY_ID[r.glass];
  if (r.method === 'shake') return 'shaker';
  return 'glass-cocktail';
}
