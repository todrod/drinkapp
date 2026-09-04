import { Seed } from './seed';

/**
 * Recipes drawn from bartending books that are in the public domain in the US
 * (everything here predates 1930).
 *
 * Ingredient lists are facts and not copyrightable; the descriptions and step
 * text below are written fresh rather than lifted, and each carries its source
 * so the attribution survives into the app.
 *
 * Deliberately excluded: The Savoy Cocktail Book (1930) — the New York Public
 * Library's own review could not conclusively determine its status, which is
 * reason enough to stay off it.
 */
export const BOOK_SEEDS: Seed[] = [
  {
    name: 'Japanese Cocktail', method: 'stir', glass: 'gl-coupe', accent: '#FFB43D',
    tags: ['spirit-forward', 'classic', 'rich'],
    source: "Jerry Thomas, How to Mix Drinks, 1862",
    ing: [
      ['sp-cognac', 2, 'oz', 'base'],
      ['sw-orgeat', 0.5, 'oz', 'sweetener'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain into a chilled coupe.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Brandy Crusta', method: 'shake', glass: 'gl-coupe', accent: '#FF3DBE',
    tags: ['citrus', 'classic', 'spirit-forward'],
    source: "Jerry Thomas, How to Mix Drinks, 1862",
    ing: [
      ['sp-cognac', 2, 'oz', 'base'],
      ['lq-curacao-dry', 0.25, 'oz', 'modifier'],
      ['lq-maraschino', 0.25, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['sw-simple', 0.25, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: [
      'Sugar the rim and line the inside of the glass with a long lemon peel.',
      'Shake everything with ice and strain in.',
    ],
    garnish: 'The peel is the garnish — that is the crusta',
  },
  {
    name: 'Improved Whiskey Cocktail', method: 'stir', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['spirit-forward', 'nightcap', 'classic'],
    source: "Jerry Thomas, Bar-Tender's Guide, 1876",
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['lq-maraschino', 1, 'tsp', 'modifier'],
      ['fl-bokers', 2, 'dash', 'modifier'],
      ['lq-absinthe', 1, 'dash', 'modifier'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: [
      'The "improvement" over a plain whiskey cocktail is the maraschino and absinthe.',
      'Stir with ice for 30 seconds and strain over a large cube.',
    ],
    garnish: 'Lemon peel',
  },
  {
    name: 'Fancy Gin Cocktail', method: 'stir', glass: 'gl-coupe', accent: '#33E6FF',
    tags: ['spirit-forward', 'classic'],
    source: "Jerry Thomas, How to Mix Drinks, 1862",
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['lq-curacao-dry', 0.25, 'oz', 'modifier'],
      ['sw-simple', 0.25, 'oz', 'sweetener'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['"Fancy" meant curaçao and a trimmed lemon peel.', 'Stir with ice and strain.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Knickerbocker', method: 'shake', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['citrus', 'classic', 'tropical'],
    source: "Jerry Thomas, How to Mix Drinks, 1862",
    ing: [
      ['sp-rum-white', 2, 'oz', 'base'],
      ['lq-curacao-dry', 0.5, 'oz', 'modifier'],
      ['sw-grenadine', 0.5, 'oz', 'sweetener'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake with ice.', 'Pour over crushed ice.'],
    garnish: 'Whatever berries are in the house',
  },
  {
    name: 'Gin Fix', method: 'build', glass: 'gl-rocks', accent: '#C6FF3D',
    tags: ['citrus', 'refreshing', 'classic'],
    source: "Jerry Thomas, How to Mix Drinks, 1862",
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: [
      'A fix is a sour built over crushed ice rather than shaken and strained.',
      'Stir in the glass until it frosts.',
    ],
    garnish: 'Lemon wheel',
  },
  {
    name: 'Jersey Cocktail', method: 'stir', glass: 'gl-coupe', accent: '#FFB43D',
    tags: ['classic', 'low-abv'],
    source: "Jerry Thomas, How to Mix Drinks, 1862",
    ing: [
      ['sp-apple-brandy', 2, 'oz', 'base'],
      ['sw-simple', 0.25, 'oz', 'sweetener'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice and strain into a chilled glass.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Saratoga', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['spirit-forward', 'nightcap', 'classic'],
    source: "Jerry Thomas, Bar-Tender's Guide, 1887",
    ing: [
      ['sp-cognac', 1, 'oz', 'base'],
      ['sp-bourbon', 1, 'oz', 'base'],
      ['lq-vermouth-sweet', 1, 'oz', 'modifier'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Equal parts, stirred with ice for 30 seconds.', 'Strain into a chilled coupe.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'East India Cocktail', method: 'stir', glass: 'gl-coupe', accent: '#FF3DBE',
    tags: ['spirit-forward', 'classic'],
    source: "Jerry Thomas, Bar-Tender's Guide, 1887",
    ing: [
      ['sp-cognac', 2, 'oz', 'base'],
      ['lq-curacao-dry', 0.25, 'oz', 'modifier'],
      ['sw-grenadine', 0.25, 'oz', 'sweetener'],
      ['lq-maraschino', 1, 'tsp', 'modifier'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice and strain into a chilled coupe.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Aviation', method: 'shake', glass: 'gl-coupe', accent: '#33E6FF',
    tags: ['citrus', 'classic', 'refreshing'],
    source: 'Hugo Ensslin, Recipes for Mixed Drinks, 1917',
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['lq-maraschino', 0.5, 'oz', 'modifier'],
      ['sw-simple', 0.25, 'oz', 'sweetener', true],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: [
      'Ensslin’s original also took crème de violette, which is what makes it pale blue.',
      'Shake hard with ice and double-strain.',
    ],
    garnish: 'Cocktail cherry',
  },
  {
    name: 'Tuxedo', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['spirit-forward', 'classic'],
    source: 'Hugo Ensslin, Recipes for Mixed Drinks, 1917',
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['lq-vermouth-dry', 1.5, 'oz', 'modifier'],
      ['lq-maraschino', 1, 'tsp', 'modifier'],
      ['lq-absinthe', 1, 'dash', 'modifier'],
      ['fl-orange-bitters', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain into a chilled coupe.'],
    garnish: 'Lemon twist and a cherry',
  },
  {
    name: "Widow's Kiss", method: 'stir', glass: 'gl-coupe', accent: '#FFB43D',
    tags: ['nightcap', 'herbal', 'classic'],
    source: 'George Kappeler, Modern American Drinks, 1895',
    ing: [
      ['sp-apple-brandy', 1.5, 'oz', 'base'],
      ['lq-benedictine', 0.75, 'oz', 'modifier'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice and strain into a chilled coupe.', 'Rich and very autumnal — a sipper.'],
    garnish: 'Cocktail cherry',
  },
];

/**
 * Themed collections — fan-flavoured drinks grouped for a party.
 *
 * Names are evocative rather than lifted from any single franchise, since the
 * app is publicly hosted. If you only ever run this privately, rename them to
 * whatever you like: theme membership is one field.
 */
export const THEMED_SEEDS: Seed[] = [
  // ── Middle-earth ───────────────────────────────────────────────────────
  {
    name: 'Second Breakfast', method: 'shake', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['brunch', 'rich'], theme: 'middle-earth',
    ing: [
      ['lq-spiced-cider', 1.5, 'oz', 'base'],
      ['sp-apple-brandy', 0.75, 'oz', 'base'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake with ice and strain over a large cube.', 'Best had shortly after first breakfast.'],
    garnish: 'Apple slice',
  },
  {
    name: 'Elvish Starlight', method: 'build', glass: 'gl-collins', accent: '#C6FF3D',
    tags: ['refreshing', 'low-abv', 'summer'], theme: 'middle-earth',
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['lq-elderflower', 0.75, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['mx-soda', 3, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice and stir once.', 'Pale, floral and deceptively strong.'],
    garnish: 'Lemon peel',
  },
  {
    name: "Dragon's Hoard", method: 'shake', glass: 'gl-hurricane', accent: '#FFB43D',
    tags: ['tiki', 'tropical', 'party'], theme: 'middle-earth',
    ing: [
      ['sp-rum-aged', 2, 'oz', 'base'],
      ['lq-allspice', 0.25, 'oz', 'modifier'],
      ['mx-pineapple', 1.5, 'oz', 'mixer'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['sw-demerara', 0.5, 'oz', 'sweetener'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake and pour over crushed ice.', 'Gold, spiced, and hard to stop at one.'],
    garnish: 'Pineapple wedge',
  },
  {
    name: 'Barrel-Rider', method: 'build', glass: 'gl-mug', accent: '#C6FF3D',
    tags: ['spicy', 'easy', 'refreshing'], theme: 'middle-earth',
    ing: [
      ['sp-rum-dark', 2, 'oz', 'base'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['mx-ginger-beer', 4, 'oz', 'mixer'],
      ['fl-angostura', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice, bitters last so they sit on top.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Mirkwood', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['bitter', 'herbal', 'nightcap'], theme: 'middle-earth',
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['lq-fernet', 0.25, 'oz', 'modifier'],
      ['lq-maraschino', 0.25, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake or stir hard, strain into a chilled coupe.', 'Dark, resinous, faintly menacing.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Mountain Forge', method: 'shake', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['tiki', 'spicy', 'spirit-forward'], theme: 'middle-earth',
    ing: [
      ['sp-rum-jamaican', 1.5, 'oz', 'base'],
      ['lq-falernum', 0.5, 'oz', 'modifier'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['fl-tiki-bitters', 2, 'dash', 'modifier'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard and pour over crushed ice.', 'High-proof and unapologetic.'],
    garnish: 'Lime wheel',
  },

  // ── Fairytale ──────────────────────────────────────────────────────────
  {
    name: 'Poisoned Apple', method: 'shake', glass: 'gl-coupe', accent: '#FF3DBE',
    tags: ['citrus', 'party'], theme: 'fairytale',
    ing: [
      ['sp-apple-brandy', 1.5, 'oz', 'base'],
      ['lq-cherry', 0.5, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-grenadine', 0.25, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake with ice and double-strain.', 'Deep red, and sweeter than it looks.'],
    garnish: 'Apple slice',
  },
  {
    name: 'Glass Slipper', method: 'build', glass: 'gl-flute', accent: '#33E6FF',
    tags: ['low-abv', 'brunch', 'refreshing'], theme: 'fairytale',
    ing: [
      ['sp-gin', 1, 'oz', 'base'],
      ['lq-italicus', 0.75, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['mx-soda', 3, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build gently so it stays clear.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Midnight Coach', method: 'shake', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['rich', 'nightcap'], theme: 'fairytale',
    ing: [
      ['sp-vodka', 1.5, 'oz', 'base'],
      ['lq-coffee', 0.75, 'oz', 'modifier'],
      ['lq-choc', 0.5, 'oz', 'modifier'],
      ['mx-half-and-half', 0.5, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake very hard with ice.', 'Double-strain and drink before it turns back into a pumpkin.'],
  },
  {
    name: 'Sea Glass', method: 'shake', glass: 'gl-collins', accent: '#33E6FF',
    tags: ['refreshing', 'summer'], theme: 'fairytale',
    ing: [
      ['sp-gin', 1.5, 'oz', 'base'],
      ['sw-lychee', 0.75, 'oz', 'sweetener'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['mx-soda', 3, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake the first three, strain over ice, top with soda.'],
    garnish: 'Lime wheel',
  },
  {
    name: "Pirate's Grog", method: 'shake', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['tiki', 'tropical', 'party'], theme: 'fairytale',
    ing: [
      ['sp-rum-jamaican', 1, 'oz', 'base'],
      ['sp-rum-aged', 1, 'oz', 'base'],
      ['lq-falernum', 0.5, 'oz', 'modifier'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['ic-crushed', null, 'piece', 'ice'],
    ],
    steps: ['Shake and pour unstrained over crushed ice.'],
    garnish: 'Lime shell',
  },
  {
    name: 'Wishing Well', method: 'build', glass: 'gl-highball', accent: '#C6FF3D',
    tags: ['low-abv', 'refreshing', 'easy'], theme: 'fairytale',
    ing: [
      ['sp-vodka', 1.5, 'oz', 'base'],
      ['lq-elderflower', 0.5, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.5, 'oz', 'mixer'],
      ['mx-tonic', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over plenty of ice.'],
    garnish: 'Lemon wheel',
  },

  // ── Galaxy ─────────────────────────────────────────────────────────────
  {
    name: 'Twin Suns', method: 'shake', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['citrus', 'party'], theme: 'galaxy',
    ing: [
      ['sp-tequila-blanco', 1.5, 'oz', 'base'],
      ['lq-blood-orange', 0.75, 'oz', 'modifier'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.25, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard and strain over fresh ice.'],
    garnish: 'Orange wheel',
  },
  {
    name: 'Hyperdrive', method: 'build', glass: 'gl-collins', accent: '#33E6FF',
    tags: ['spicy', 'party', 'refreshing'], theme: 'galaxy',
    ing: [
      ['sp-vodka', 1.5, 'oz', 'base'],
      ['lq-cointreau', 0.5, 'oz', 'modifier'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['mx-ginger-beer', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice; ginger beer last.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Cantina Special', method: 'shake', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['tiki', 'spicy'], theme: 'galaxy',
    ing: [
      ['sp-tequila-blanco', 1.5, 'oz', 'base'],
      ['lq-falernum', 0.5, 'oz', 'modifier'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['fl-tropical-bitters', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake with ice and strain over a large cube.', 'They do not serve droids, but they will serve this.'],
    garnish: 'Lime wheel',
  },
  {
    name: 'Nebula', method: 'build', glass: 'gl-flute', accent: '#A855F7',
    tags: ['low-abv', 'brunch'], theme: 'galaxy',
    ing: [
      ['lq-italicus', 1, 'oz', 'base'],
      ['wn-prosecco', 3, 'oz', 'mixer'],
      ['mx-soda', 1, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Sparkling first, then the liqueur, so it swirls rather than sinks.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Ion Storm', method: 'shake', glass: 'gl-coupe', accent: '#C6FF3D',
    tags: ['spirit-forward', 'tiki'], theme: 'galaxy',
    ing: [
      ['sp-rum-jamaican', 1.5, 'oz', 'base'],
      ['mx-lime-juice', 0.75, 'oz', 'mixer'],
      ['sw-demerara', 0.5, 'oz', 'sweetener'],
      ['lq-absinthe', 1, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Rinse the glass with absinthe.', 'Shake the rest hard and double-strain in.'],
    garnish: 'Lime peel',
  },
  {
    name: 'Dark Side', method: 'stir', glass: 'gl-rocks', accent: '#A855F7',
    tags: ['bitter', 'nightcap', 'spirit-forward'], theme: 'galaxy',
    ing: [
      ['sp-bourbon', 2, 'oz', 'base'],
      ['lq-amaro', 0.75, 'oz', 'modifier'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['fl-chocolate-bitters', 2, 'dash', 'modifier'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds and strain over a large cube.'],
    garnish: 'Orange peel',
  },

  // ── Spooky ─────────────────────────────────────────────────────────────
  {
    name: 'Black Cat', method: 'build', glass: 'gl-highball', accent: '#A855F7',
    tags: ['easy', 'party'], theme: 'spooky',
    ing: [
      ['sp-vodka', 1.5, 'oz', 'base'],
      ['lq-coffee', 0.75, 'oz', 'modifier'],
      ['mx-cola', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice. Darker and less sweet than it sounds.'],
    garnish: 'Lemon peel',
  },
  {
    name: 'Graveyard Fog', method: 'shake', glass: 'gl-coupe', accent: '#C6FF3D',
    tags: ['herbal', 'citrus'], theme: 'spooky',
    ing: [
      ['sp-gin', 2, 'oz', 'base'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-simple', 0.5, 'oz', 'sweetener'],
      ['lq-absinthe', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard — the absinthe turns it cloudy, which is the point.'],
    garnish: 'Lemon twist',
  },
  {
    name: 'Pumpkin King', method: 'stir', glass: 'gl-rocks', accent: '#FFB43D',
    tags: ['rich', 'nightcap'], theme: 'spooky',
    ing: [
      ['sp-bourbon', 1.5, 'oz', 'base'],
      ['wn-madeira', 0.75, 'oz', 'modifier'],
      ['lq-allspice', 0.25, 'oz', 'modifier'],
      ['sw-demerara', 0.25, 'oz', 'sweetener'],
      ['fl-tiki-bitters', 2, 'dash', 'modifier'],
      ['ic-big-cube', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice and strain over a large cube.'],
    garnish: 'Orange peel',
  },
  {
    name: "Witch's Brew", method: 'build', glass: 'gl-mug', accent: '#C6FF3D',
    tags: ['herbal', 'spicy', 'party'], theme: 'spooky',
    ing: [
      ['lq-jager', 1.5, 'oz', 'base'],
      ['mx-lime-juice', 0.5, 'oz', 'mixer'],
      ['mx-ginger-beer', 4, 'oz', 'mixer'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Build over ice. Much better than its reputation suggests.'],
    garnish: 'Lime wedge',
  },
  {
    name: 'Blood Orange Sour', method: 'shake', glass: 'gl-rocks', accent: '#FF3DBE',
    tags: ['citrus', 'party'], theme: 'spooky',
    ing: [
      ['sp-bourbon', 1.5, 'oz', 'base'],
      ['lq-blood-orange', 0.75, 'oz', 'modifier'],
      ['mx-lemon-juice', 0.75, 'oz', 'mixer'],
      ['sw-grenadine', 0.25, 'oz', 'sweetener'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Shake hard and strain over fresh ice.', 'Let the grenadine settle for the streaked look.'],
    garnish: 'Orange wheel',
  },
  {
    name: 'Last Rites', method: 'stir', glass: 'gl-coupe', accent: '#A855F7',
    tags: ['bitter', 'nightcap', 'spirit-forward'], theme: 'spooky',
    ing: [
      ['sp-rye', 1.5, 'oz', 'base'],
      ['lq-fernet', 0.5, 'oz', 'modifier'],
      ['lq-benedictine', 0.5, 'oz', 'modifier'],
      ['fl-peychauds', 2, 'dash', 'modifier'],
      ['ic-cubes', null, 'piece', 'ice'],
    ],
    steps: ['Stir with ice for 30 seconds.', 'Strain into a chilled coupe and sip slowly.'],
    garnish: 'Lemon peel',
  },
];
