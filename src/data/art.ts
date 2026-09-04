import { Shape } from '../components/IngredientArt';
import { CATALOG_BY_ID } from './catalog';
import { Category } from '../types';

/**
 * Silhouette and liquid colour per ingredient.
 *
 * Resolved by id first — the colours are the point, and "agave gold" versus
 * "sugarcane clear" is not derivable from the category — then by spirit type,
 * then by kind, then by category so a free-typed custom item still draws.
 */

export interface Art {
  shape: Shape;
  liquid: string;
}

const L = {
  clear: '#DCEEF5',
  juniper: '#8FD9E8',
  agave: '#E8C77A',
  cane: '#F0E3C2',
  amber: '#C8792B',
  darkAmber: '#8A4A20',
  deepBrown: '#4A2A16',
  red: '#C4152C',
  orange: '#F0721E',
  gold: '#D9A32B',
  cream: '#EFDDBE',
  coffee: '#3A2216',
  green: '#8DBE3C',
  lime: '#9BCB3B',
  lemon: '#EFD64A',
  pink: '#E8A0BE',
  wine: '#6E1428',
  paleGreen: '#DCE8C8',
  cola: '#3A1D0E',
  tomato: '#C0341F',
  water: '#E4F2F7',
  black: '#241309',
} as const;

const BY_ID: Record<string, Art> = {
  // Agave and cane
  'sp-tequila-blanco': { shape: 'tall', liquid: L.clear },
  'sp-tequila-repo': { shape: 'tall', liquid: L.agave },
  'sp-mezcal': { shape: 'tall', liquid: L.agave },
  'sp-rum-white': { shape: 'wide', liquid: L.cane },
  'sp-rum-aged': { shape: 'wide', liquid: L.amber },
  'sp-rum-dark': { shape: 'wide', liquid: L.darkAmber },
  'sp-rum-jamaican': { shape: 'wide', liquid: L.darkAmber },
  'sp-cachaca': { shape: 'wide', liquid: L.cane },

  // Grain
  'sp-vodka': { shape: 'tall', liquid: L.clear },
  'sp-gin': { shape: 'tall', liquid: L.juniper },
  'lq-sloe-gin': { shape: 'squat', liquid: '#8E1F3A' },
  'sp-bourbon': { shape: 'wide', liquid: L.amber },
  'sp-rye': { shape: 'wide', liquid: '#B9682A' },
  'sp-scotch': { shape: 'wide', liquid: '#A85F26' },
  'sp-peach-whiskey': { shape: 'wide', liquid: '#E8A15C' },
  'sp-caramel-whisky': { shape: 'wide', liquid: '#C07A28' },
  'sp-pb-whiskey': { shape: 'wide', liquid: '#B67A3C' },
  'lq-spiced-cider': { shape: 'squat', liquid: '#C8862E' },

  // Brandy
  'sp-brandy': { shape: 'wide', liquid: '#B2603A' },
  'sp-cognac': { shape: 'wide', liquid: '#B2603A' },
  'sp-apple-brandy': { shape: 'wide', liquid: '#D9A24A' },
  'sp-plum-brandy': { shape: 'tall', liquid: '#C8A9C0' },

  // Aperitivo and vermouth
  'lq-campari': { shape: 'wine', liquid: L.red },
  'lq-aperol': { shape: 'wine', liquid: L.orange },
  'lq-vermouth-sweet': { shape: 'wine', liquid: '#8E2B2B' },
  'lq-vermouth-dry': { shape: 'wine', liquid: L.paleGreen },
  'wn-madeira': { shape: 'wine', liquid: '#8A4A22' },
  'lq-amaro': { shape: 'squat', liquid: '#5A2B18' },
  'lq-fernet': { shape: 'wine', liquid: '#2E1A12' },
  'lq-jager': { shape: 'squat', liquid: '#2A1A10' },
  'lq-underberg': { shape: 'dasher', liquid: '#2A1A10' },
  'lq-benedictine': { shape: 'squat', liquid: '#B9852F' },
  'lq-absinthe': { shape: 'wine', liquid: L.green },

  // Orange and fruit liqueurs
  'lq-triple-sec': { shape: 'squat', liquid: '#E9A13B' },
  'lq-cointreau': { shape: 'squat', liquid: '#E2801F' },
  'lq-curacao-dry': { shape: 'squat', liquid: '#D98A24' },
  'lq-grand-marnier': { shape: 'squat', liquid: '#C87A22' },
  'lq-blue-curacao': { shape: 'squat', liquid: '#2E9BD6' },
  'lq-maraschino': { shape: 'squat', liquid: '#EFE6D2' },
  'lq-limoncello': { shape: 'tall', liquid: L.lemon },
  'lq-apricot': { shape: 'squat', liquid: '#E8A94E' },
  'lq-elderflower': { shape: 'squat', liquid: '#E4D69A' },
  'lq-italicus': { shape: 'squat', liquid: '#EDE2B8' },
  'lq-mandarine': { shape: 'squat', liquid: '#EE9A2E' },
  'lq-blood-orange': { shape: 'squat', liquid: '#D8442A' },
  'lq-pear': { shape: 'squat', liquid: '#DCE0A8' },
  'lq-cherry': { shape: 'squat', liquid: '#A8203C' },
  'lq-peach': { shape: 'squat', liquid: '#F0B07A' },

  // Cream, coffee, nut
  'lq-coffee': { shape: 'squat', liquid: L.coffee },
  'lq-irish-cream': { shape: 'squat', liquid: L.cream },
  'lq-tiramisu': { shape: 'squat', liquid: '#D8BE94' },
  'lq-caramel': { shape: 'squat', liquid: '#C4862E' },
  'lq-butterscotch': { shape: 'squat', liquid: '#D9A03A' },
  'lq-choc': { shape: 'squat', liquid: '#4A2A18' },
  'lq-hazelnut': { shape: 'squat', liquid: '#8E4A1E' },
  'lq-amaretto': { shape: 'squat', liquid: '#8E4A1E' },
  'lq-peppermint': { shape: 'tall', liquid: '#CFEDE0' },
  'lq-falernum': { shape: 'squat', liquid: '#E8DFC0' },
  'lq-allspice': { shape: 'squat', liquid: '#5E3418' },

  // Wine and beer
  'wn-prosecco': { shape: 'wine', liquid: '#E8DFA8' },
  'wn-champagne': { shape: 'wine', liquid: '#EDE2B0' },
  'wn-red': { shape: 'wine', liquid: L.wine },
  'wn-white': { shape: 'wine', liquid: '#E8DFA8' },
  'br-lager': { shape: 'wine', liquid: '#E0A22E' },
  'br-stout': { shape: 'wine', liquid: L.black },
  'br-pumpkin-ale': { shape: 'wine', liquid: '#D07A22' },

  // Mixers
  'mx-soda': { shape: 'soda', liquid: L.water },
  'mx-tonic': { shape: 'soda', liquid: '#DCEFF2' },
  'mx-cola': { shape: 'can', liquid: L.cola },
  'mx-ginger-beer': { shape: 'soda', liquid: '#D8A55A' },
  'mx-ginger-ale': { shape: 'soda', liquid: '#E6C98A' },
  'mx-lemon-lime': { shape: 'can', liquid: '#CFE8A0' },
  'mx-oj': { shape: 'carton', liquid: '#F08A1E' },
  'mx-pineapple': { shape: 'carton', liquid: '#F2C230' },
  'mx-cranberry': { shape: 'carton', liquid: '#B0163C' },
  'mx-grapefruit': { shape: 'carton', liquid: '#E8776A' },
  'mx-tomato': { shape: 'carton', liquid: L.tomato },
  'mx-lime-juice': { shape: 'carton', liquid: L.lime },
  'mx-lemon-juice': { shape: 'carton', liquid: L.lemon },
  'mx-lemonade': { shape: 'carton', liquid: '#F2DE7A' },
  'mx-iced-tea': { shape: 'carton', liquid: '#8A5A2B' },
  'mx-black-tea': { shape: 'cup', liquid: '#8A5A2B' },
  'mx-espresso': { shape: 'cup', liquid: L.coffee },
  'mx-cold-brew': { shape: 'cup', liquid: '#4A2A18' },
  'mx-milk': { shape: 'carton', liquid: '#F4EFE4' },
  'mx-cream': { shape: 'carton', liquid: '#F6F0E2' },
  'mx-half-and-half': { shape: 'carton', liquid: '#F4EFE4' },
  'mx-creamer': { shape: 'carton', liquid: '#F2EADA' },
  'mx-coconut-cream': { shape: 'can', liquid: '#F6F1E6' },

  // Sweet
  'sw-simple': { shape: 'squeeze', liquid: '#EFEFE6' },
  'sw-demerara': { shape: 'squeeze', liquid: '#9A6528' },
  'sw-grenadine': { shape: 'squeeze', liquid: '#C3123B' },
  'sw-agave': { shape: 'squeeze', liquid: '#D9A32B' },
  'sw-honey': { shape: 'squeeze', liquid: L.gold },
  'sw-orgeat': { shape: 'squeeze', liquid: '#EDE3CE' },
  'sw-passion-fruit': { shape: 'squeeze', liquid: '#F0A72B' },
  'sw-lychee': { shape: 'squeeze', liquid: '#F2D9E4' },
  'sw-vanilla': { shape: 'squeeze', liquid: '#E4D2A8' },
  'sw-sugar': { shape: 'cube', liquid: '#F2EDE0' },

  // Flavour
  'fl-angostura': { shape: 'dasher', liquid: '#5A2E1B' },
  'fl-orange-bitters': { shape: 'dasher', liquid: '#C87A22' },
  'fl-peychauds': { shape: 'dasher', liquid: '#B02A2A' },
  'fl-tiki-bitters': { shape: 'dasher', liquid: '#6A3A1E' },
  'fl-tropical-bitters': { shape: 'dasher', liquid: '#D8562A' },
  'fl-lemon-bitters': { shape: 'dasher', liquid: L.lemon },
  'fl-lavender-bitters': { shape: 'dasher', liquid: '#9D8CF0' },
  'fl-bokers': { shape: 'dasher', liquid: '#4A2A16' },
  'fl-cherry-bitters': { shape: 'dasher', liquid: '#8E1F2E' },
  'fl-sassafras-bitters': { shape: 'dasher', liquid: '#6A3A1E' },
  'fl-chocolate-bitters': { shape: 'dasher', liquid: '#3A2216' },
  'fl-hot-sauce': { shape: 'dasher', liquid: '#C4241C' },
  'fl-worcestershire': { shape: 'dasher', liquid: '#3A2216' },
  'fl-mint': { shape: 'leaf', liquid: '#3E9B4F' },
  'fl-basil': { shape: 'leaf', liquid: '#347F42' },
  'fl-cucumber': { shape: 'leaf', liquid: '#6FBF5A' },
  'fl-jalapeno': { shape: 'leaf', liquid: '#4FAE3C' },
  'fl-salt': { shape: 'squeeze', liquid: '#F2F2EC' },
  'fl-pepper': { shape: 'squeeze', liquid: '#3A3128' },

  // Garnish
  'gn-lime': { shape: 'wedge', liquid: L.lime },
  'gn-lemon': { shape: 'wedge', liquid: L.lemon },
  'gn-orange': { shape: 'wedge', liquid: L.orange },
  'gn-cherry': { shape: 'fruit', liquid: '#B3122E' },
  'gn-strawberry': { shape: 'fruit', liquid: '#D4243C' },
  'gn-watermelon': { shape: 'wedge', liquid: '#E4576B' },
  'gn-pineapple': { shape: 'wedge', liquid: '#F2C230' },
  'gn-olive': { shape: 'fruit', liquid: '#8A9B3C' },
  'gn-celery': { shape: 'leaf', liquid: '#7FB03C' },

  // Ice
  'ic-cubes': { shape: 'cube', liquid: '#BFE8F2' },
  'ic-crushed': { shape: 'cube', liquid: '#D2F0F8' },
  'ic-big-cube': { shape: 'cube', liquid: '#A8DCEC' },

  // Glassware
  'gl-rocks': { shape: 'glass', liquid: '#2A4652' },
  'gl-highball': { shape: 'glass', liquid: '#2A4652' },
  'gl-collins': { shape: 'glass', liquid: '#2A4652' },
  'gl-coupe': { shape: 'coupe', liquid: '#2A4652' },
  'gl-martini': { shape: 'coupe', liquid: '#2A4652' },
  'gl-flute': { shape: 'coupe', liquid: '#2A4652' },
  'gl-mug': { shape: 'glass', liquid: '#2A4652' },
  'gl-hurricane': { shape: 'coupe', liquid: '#2A4652' },

  // Vibe
  'vb-rim-salt': { shape: 'squeeze', liquid: '#F2F2EC' },
  'vb-straws': { shape: 'cup', liquid: '#4FBFD8' },
  'vb-umbrella': { shape: 'leaf', liquid: '#E8567A' },
  'vb-sparkler': { shape: 'tool', liquid: '#E8C24A' },
};

const BY_SPIRIT: Record<string, Art> = {
  vodka: { shape: 'tall', liquid: L.clear },
  gin: { shape: 'tall', liquid: L.juniper },
  rum: { shape: 'wide', liquid: L.amber },
  tequila: { shape: 'tall', liquid: L.agave },
  mezcal: { shape: 'tall', liquid: L.agave },
  whiskey: { shape: 'wide', liquid: L.amber },
  brandy: { shape: 'wide', liquid: '#B2603A' },
  aperitif: { shape: 'wine', liquid: L.red },
};

const BY_KIND: Record<string, Art> = {
  spirit: { shape: 'tall', liquid: L.clear },
  liqueur: { shape: 'squat', liquid: L.gold },
  wine: { shape: 'wine', liquid: L.wine },
  beer: { shape: 'wine', liquid: '#E0A22E' },
  mixer: { shape: 'soda', liquid: L.water },
  syrup: { shape: 'squeeze', liquid: L.gold },
  bitters: { shape: 'dasher', liquid: L.deepBrown },
  garnish: { shape: 'wedge', liquid: L.lime },
  ice: { shape: 'cube', liquid: '#BFE8F2' },
  tool: { shape: 'tool', liquid: '#9FB6C0' },
  glass: { shape: 'glass', liquid: '#2A4652' },
  extra: { shape: 'squat', liquid: '#9FB6C0' },
};

const BY_CATEGORY: Record<Category, Art> = {
  beverage: { shape: 'tall', liquid: L.amber },
  mixer: { shape: 'soda', liquid: L.water },
  garnish: { shape: 'wedge', liquid: L.lime },
  flavor: { shape: 'dasher', liquid: L.deepBrown },
  ice: { shape: 'cube', liquid: '#BFE8F2' },
  glass: { shape: 'glass', liquid: '#2A4652' },
  sweet: { shape: 'squeeze', liquid: L.gold },
  tool: { shape: 'tool', liquid: '#9FB6C0' },
  vibe: { shape: 'squat', liquid: '#E8567A' },
};

export function artForCatalog(catalogId: string | null, category: Category): Art {
  if (catalogId) {
    if (BY_ID[catalogId]) return BY_ID[catalogId];
    const cat = CATALOG_BY_ID[catalogId];
    if (cat) {
      if (cat.spiritType && BY_SPIRIT[cat.spiritType]) return BY_SPIRIT[cat.spiritType];
      if (BY_KIND[cat.kind]) return BY_KIND[cat.kind];
    }
  }
  return BY_CATEGORY[category] ?? BY_CATEGORY.beverage;
}
