import type { CatalogRow } from '../types';

/** Distinct ingredients stay distinct; a missing specialty bottle must not silently become a different drink. */
export const DISCOVERY_CATALOG: CatalogRow[] = [
  { id: 'sp-pisco', name: 'Pisco', kind: 'spirit', category: 'beverage', spirit: 'brandy', abv: 40, notes: ['grape', 'floral'], blurb: 'Unaged grape brandy for a Pisco Sour.', icon: '🥃' },
  { id: 'sp-scotch-peated', name: 'Peated Scotch', kind: 'spirit', category: 'beverage', spirit: 'whiskey', abv: 43, notes: ['smoke', 'peat'], blurb: 'A smoky single malt for the float on a Penicillin.', icon: '🥃' },
  { id: 'sp-vodka-vanilla', name: 'Vanilla vodka', kind: 'spirit', category: 'beverage', spirit: 'vodka', abv: 40, notes: ['vanilla'], blurb: 'Vanilla-flavored vodka; keep separate from plain vodka.', icon: '🍾' },
  { id: 'lq-chartreuse-green', name: 'Green Chartreuse', kind: 'liqueur', category: 'beverage', abv: 55, notes: ['herbal', 'anise'], blurb: 'Intense herbal liqueur used in the Last Word.', icon: '🌿' },
  { id: 'lq-chartreuse-yellow', name: 'Yellow Chartreuse', kind: 'liqueur', category: 'beverage', abv: 43, notes: ['herbal', 'honey'], blurb: 'Milder and honeyed; distinct from Green Chartreuse.', icon: '🌿' },
  { id: 'lq-nonino', name: 'Amaro Nonino', kind: 'liqueur', category: 'beverage', abv: 35, notes: ['bitter', 'orange', 'herbal'], blurb: 'The amaro specified in a Paper Plane.', icon: '🥃' },
  { id: 'lq-drambuie', name: 'Drambuie', kind: 'liqueur', category: 'beverage', abv: 40, notes: ['honey', 'herbal', 'whisky'], blurb: 'Scotch and honey liqueur for a Rusty Nail.', icon: '🍯' },
  { id: 'lq-blackberry', name: 'Crème de mûre', kind: 'liqueur', category: 'beverage', abv: 16, notes: ['blackberry', 'berry'], blurb: 'Blackberry liqueur poured over a Bramble.', icon: '🫐' },
  { id: 'lq-raspberry', name: 'Raspberry liqueur', kind: 'liqueur', category: 'beverage', abv: 16, notes: ['raspberry', 'berry'], blurb: 'Raspberry liqueur for the French Martini.', icon: '🫐' },
  { id: 'lq-passion-fruit', name: 'Passion fruit liqueur', kind: 'liqueur', category: 'beverage', abv: 17, notes: ['passion fruit', 'tropical'], blurb: 'An alcoholic passion fruit modifier, separate from syrup.', icon: '🍹' },
  { id: 'lq-cacao-white', name: 'White crème de cacao', kind: 'liqueur', category: 'beverage', abv: 25, notes: ['chocolate', 'cocoa'], blurb: 'Clear chocolate liqueur for a Grasshopper.', icon: '🍫' },
  { id: 'lq-menthe-green', name: 'Green crème de menthe', kind: 'liqueur', category: 'beverage', abv: 25, notes: ['mint', 'sweet'], blurb: 'Sweet green mint liqueur; not peppermint schnapps.', icon: '🌿' },
  { id: 'lq-cassis', name: 'Crème de cassis', kind: 'liqueur', category: 'beverage', abv: 20, notes: ['blackcurrant', 'berry'], blurb: 'Blackcurrant liqueur for Kir and Kir Royale.', icon: '🫐' },
  { id: 'sw-raspberry', name: 'Raspberry syrup', kind: 'syrup', category: 'sweet', abv: 0, notes: ['raspberry', 'berry'], blurb: 'Nonalcoholic raspberry syrup for a Clover Club.', icon: '🫐' },
  { id: 'sw-vanilla-sugar', name: 'Vanilla sugar', kind: 'syrup', category: 'sweet', abv: 0, notes: ['vanilla', 'sweet'], blurb: 'Sugar scented with vanilla; dissolve fully when mixing.', icon: '🍬' },
  { id: 'mx-peach-puree', name: 'White peach purée', kind: 'mixer', category: 'mixer', abv: 0, notes: ['peach', 'fruit'], blurb: 'Smooth peach purée for a Bellini.', icon: '🍑' },
  { id: 'mx-strawberry-puree', name: 'Strawberry purée', kind: 'mixer', category: 'mixer', abv: 0, notes: ['strawberry', 'berry'], blurb: 'Blended strawberries for a Rossini.', icon: '🍓' },
  { id: 'mx-passion-puree', name: 'Passion fruit purée', kind: 'mixer', category: 'mixer', abv: 0, notes: ['passion fruit', 'tart', 'tropical'], blurb: 'Unsweetened passion fruit pulp, distinct from syrup.', icon: '🍹' },
  { id: 'mx-water', name: 'Water', kind: 'mixer', category: 'mixer', abv: 0, staple: true, notes: [], blurb: 'Plain drinking water, assumed on hand.', icon: '💧' },
  { id: 'fl-ginger', name: 'Fresh ginger', kind: 'garnish', category: 'flavor', abv: 0, notes: ['ginger', 'spicy'], blurb: 'Fresh slices, peeled before muddling.', icon: '🫚' },
  { id: 'mx-egg-white', name: 'Pasteurized egg white', kind: 'mixer', category: 'mixer', abv: 0, notes: ['foam'], blurb: 'Pasteurized egg white adds foam; one piece means one egg white.', icon: '🥚' },
];
